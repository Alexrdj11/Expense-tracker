package com.expensetracker.backend.controller;

import com.expensetracker.backend.model.Category;
import com.expensetracker.backend.model.Expense;
import com.expensetracker.backend.repository.AppUserRepository;
import com.expensetracker.backend.repository.CategoryRepository;
import com.expensetracker.backend.repository.ExpenseRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import technology.tabula.ObjectExtractor;
import technology.tabula.Page;
import technology.tabula.RectangularTextContainer;
import technology.tabula.Table;
import technology.tabula.extractors.BasicExtractionAlgorithm;
import technology.tabula.extractors.SpreadsheetExtractionAlgorithm;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/expenses/import")
public class ExpenseImportController {

    private final ExpenseRepository expenses;
    private final CategoryRepository categories;
    private final AppUserRepository users;

    public ExpenseImportController(ExpenseRepository expenses, CategoryRepository categories, AppUserRepository users) {
        this.expenses = expenses;
        this.categories = categories;
        this.users = users;
    }

    // Upload text-based PDFs (scanned PDFs won’t work)
    @PostMapping(value = "/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> importPdf(@RequestPart("file") MultipartFile file,
                                       @RequestParam(name = "preview", defaultValue = "false") boolean preview,
                                       Principal principal) throws Exception {
        Long userId = users.findByUsername(principal.getName()).orElseThrow().getId();

        // FIX: remove stray bracket before 'byte[]'
        byte[] bytes = file.getBytes();
        String text;
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            stripper.setLineSeparator("\n");
            stripper.setWordSeparator(" ");
            text = stripper.getText(doc);
        }

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No extractable text. The PDF may be scanned."));
        }

        // Preview mode: just return the first 80 lines so we can tune the parser
        if (preview) {
            String[] lines = text.split("\\R");
            return ResponseEntity.ok(Map.of(
                    "lines", Arrays.asList(lines).subList(0, Math.min(lines.length, 120)),
                    "totalLines", lines.length
            ));
        }

        Long uncategorized = getOrCreateUncategorized(userId).getId();
        int imported = 0, failed = 0, skipped = 0;

        // 1) Try table extraction first (most bank statements are tabular)
        List<Tx> txs = extractWithTabula(bytes);
        // 1b) Try SuperMoney text format (Name Bank Amount Date Status)
        if (txs.isEmpty()) txs = extractSuperMoney(text);
        // 2) Fallback to generic line parser if nothing yet
        if (txs.isEmpty()) txs = extractFromLines(text);

        List<Map<String, Object>> errors = new ArrayList<>();
        List<Expense> batch = new ArrayList<>();
        int lineNo = 0;
        for (Tx t : txs) {
            lineNo++;
            try {
                Expense e = new Expense();
                e.setDescription(t.description);
                e.setAmount(t.amount.signum() <= 0 ? t.amount.abs() : t.amount);
                e.setExpenseDate(t.date);
                e.setCategoryId(uncategorized);
                e.setUserId(userId);
                batch.add(e);
                imported++;
            } catch (Exception ex) {
                failed++;
                errors.add(Map.of("line", lineNo, "error", ex.getMessage(), "raw", t.raw));
            }
        }

        // If still nothing, count as skipped and return quickly
        if (batch.isEmpty() && failed == 0) {
            skipped = Math.max(skipped, 1);
            return ResponseEntity.ok(Map.of("imported", 0, "failed", 0, "skipped", txs.size()));
        }

        if (!batch.isEmpty()) expenses.saveAll(batch);

        return ResponseEntity.ok(Map.of("imported", imported, "failed", failed, "skipped", skipped, "errors", errors));
    }

    // ---------- Tabula-first extraction ----------
    private List<Tx> extractWithTabula(byte[] pdf) throws Exception {
        List<Tx> out = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF(pdf)) {
            ObjectExtractor extractor = new ObjectExtractor(doc);
            SpreadsheetExtractionAlgorithm sea = new SpreadsheetExtractionAlgorithm();
            BasicExtractionAlgorithm bea = new BasicExtractionAlgorithm();

            for (int i = 1; i <= doc.getNumberOfPages(); i++) {
                Page page = extractor.extract(i);

                List<Table> tables = sea.extract(page);
                if (tables.isEmpty()) tables = bea.extract(page);

                for (Table table : tables) {
                    out.addAll(parseTable(table));
                }
            }
        }
        return out;
    }

    private List<Tx> parseTable(Table table) {
        List<Tx> out = new ArrayList<>();
        List<List<RectangularTextContainer>> rows = table.getRows();
        if (rows == null || rows.isEmpty()) return out;

        // Build a matrix of strings
        List<List<String>> data = new ArrayList<>();
        for (var row : rows) {
            List<String> r = new ArrayList<>();
            for (var cell : row) r.add(clean(cell.getText()));
            data.add(r);
        }

        // Detect header and column indices
        int headerIdx = -1, dateCol = -1, amtCol = -1, descCol = -1, typeCol = -1;
        int maxCols = data.stream().mapToInt(List::size).max().orElse(0);

        // try first 3 rows as header candidates
        for (int i = 0; i < Math.min(3, data.size()); i++) {
            List<String> r = data.get(i);
            for (int c = 0; c < r.size(); c++) {
                String v = r.get(c).toLowerCase();
                if (dateCol < 0 && v.matches(".*\\b(date|txn\\s*date|transaction\\s*date)\\b.*")) dateCol = c;
                if (amtCol < 0 && v.matches(".*\\b(amount|debit|withdrawal|dr|value)\\b.*")) amtCol = c;
                if (descCol < 0 && v.matches(".*\\b(description|narration|particulars|details|merchant|receiver)\\b.*")) descCol = c;
                if (typeCol < 0 && v.matches(".*\\b(type|dr|cr|debit|credit)\\b.*")) typeCol = c;
            }
            if (dateCol >= 0 || amtCol >= 0 || descCol >= 0) { headerIdx = i; break; }
        }

        // If columns still unknown, guess based on content stats from next ~8 rows
        if (dateCol < 0 || amtCol < 0) {
            int sampleEnd = Math.min(data.size(), (headerIdx >= 0 ? headerIdx + 10 : 10));
            int[] amountHits = new int[maxCols];
            int[] dateHits = new int[maxCols];
            Pattern amtRegex = amountPattern();
            for (int i = (headerIdx >= 0 ? headerIdx + 1 : 0); i < sampleEnd; i++) {
                List<String> r = data.get(i);
                for (int c = 0; c < r.size(); c++) {
                    String v = r.get(c);
                    if (isDateLike(v)) dateHits[c]++;
                    if (amtRegex.matcher(v).find()) amountHits[c]++;
                }
            }
            amtCol = bestIdx(amountHits);
            dateCol = bestIdx(dateHits);
        }
        if (descCol < 0) {
            // pick longest-average-text column that is not date/amount
            int best = -1;
            double bestLen = -1;
            for (int c = 0; c < maxCols; c++) {
                if (c == dateCol || c == amtCol) continue;
                double avg = 0; int cnt = 0;
                for (int i = (headerIdx >= 0 ? headerIdx + 1 : 0); i < data.size(); i++) {
                    List<String> r = data.get(i);
                    if (c < r.size()) { avg += r.get(c).length(); cnt++; }
                }
                if (cnt > 0 && avg / cnt > bestLen) { bestLen = avg / cnt; best = c; }
            }
            descCol = best;
        }

        if (dateCol < 0 || amtCol < 0 || descCol < 0) return out;

        // Parse rows
        for (int i = (headerIdx >= 0 ? headerIdx + 1 : 0); i < data.size(); i++) {
            List<String> r = data.get(i);
            String rawDate = safe(r, dateCol);
            String rawAmt = safe(r, amtCol);
            String rawDesc = safe(r, descCol);
            String rawType = typeCol >= 0 ? safe(r, typeCol) : "";
            if (!rawType.isBlank() && rawType.toUpperCase(Locale.ROOT).contains("CREDIT")) continue;
            if (rawDate.isBlank() && rawAmt.isBlank()) continue;

            try {
                LocalDate date = parseDateFlexible(rawDate);
                BigDecimal amt = parseAmount(rawAmt);
                if (amt.signum() == 0) continue;
                out.add(new Tx(date, rawDesc.isBlank() ? "Transaction" : rawDesc, amt, String.join(" | ", r)));
            } catch (Exception ignore) {
                // skip invalid rows
            }
        }
        return out;
    }

    // ---------- Fallback: line-based ----------
    private List<Tx> extractFromLines(String text) {
        List<Tx> out = new ArrayList<>();
        for (String raw : text.split("\\R")) {
            String s = clean(raw);
            if (s.isBlank()) continue;

            String type = txnTypeToken(s); // DEBIT / CREDIT / ""
            if ("CREDIT".equals(type)) continue;

            DateMatch dm = extractDateInLine(s);
            AmountMatch am = extractAmountInLine(s);
            if (dm == null || am == null) continue;

            boolean dateThenAmount = am.start > dm.end;
            boolean amountThenDate = dm.start > am.end;
            if (!dateThenAmount && !amountThenDate) continue;

            String desc = (dateThenAmount
                    ? s.substring(dm.end, am.start)
                    : s.substring(am.end, dm.start))
                    .trim().replaceAll("\\s{2,}", " ");
            if (desc.isBlank()) continue;

            BigDecimal amt = am.amount;
            // Treat as expense if:
            // - explicit DEBIT keyword (PhonePe), regardless of sign
            // - or amount is negative (SuperMoney)
            boolean isExpense = "DEBIT".equals(type) || amt.signum() < 0;
            if (!isExpense) continue;

            out.add(new Tx(dm.date, desc, amt.abs(), raw));
        }
        return out;
    }

    // ---------- helpers ----------
    private record Tx(LocalDate date, String description, BigDecimal amount, String raw) {}
    private record DateMatch(int start, int end, LocalDate date) {}
    private record AmountMatch(int start, int end, BigDecimal amount) {}

    private String clean(String s) {
        return s.replace('\u00A0', ' ')
                .replace("₹", " ")
                .replace("INR", " ")
                .replace("Rs.", " ")
                .replace("Rs", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isDateLike(String s) {
        return s.matches("\\d{4}-\\d{2}-\\d{2}")
                || s.matches("\\d{2}/\\d{2}/\\d{4}")
                || s.matches("\\d{2}-[A-Za-z]{3}-\\d{2,4}")
                || s.matches("\\d{2}\\s+[A-Za-z]{3}\\s+\\d{4}")
                || s.matches("\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{4}") // 10 October 2025
                || s.matches("[A-Za-z]{3}\\s+\\d{1,2},\\s+\\d{4}"); // Sep 29, 2025
    }

    private Pattern amountPattern() {
        // Allow +, -, parentheses, commas/decimals
        return Pattern.compile("(?:₹|INR|Rs\\.?\\s*)?[+\\-(]?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?[)]?", Pattern.CASE_INSENSITIVE);
    }

    private int bestIdx(int[] hits) {
        int idx = -1, best = -1;
        for (int i = 0; i < hits.length; i++) if (hits[i] > best) { best = hits[i]; idx = i; }
        return idx;
    }

    private String safe(List<String> r, int c) { return c >= 0 && c < r.size() ? r.get(c) : ""; }

    private DateMatch extractDateInLine(String s) {
        String[] regs = {
                "(\\d{4}-\\d{2}-\\d{2})",
                "(\\d{2}/\\d{2}/\\d{4})",
                "(\\d{2}-[A-Za-z]{3}-\\d{2,4})",
                "(\\d{2}\\s+[A-Za-z]{3}\\s+\\d{4})",
                "([A-Za-z]{3}\\s+\\d{1,2},\\s+\\d{4})" // MMM dd, uuuu
        };
        DateTimeFormatter[] fmts = {
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/uuuu"),
                DateTimeFormatter.ofPattern("dd-MMM-uuuu"),
                DateTimeFormatter.ofPattern("dd MMM uuuu"),
                DateTimeFormatter.ofPattern("MMM dd, uuuu", Locale.ENGLISH)
        };
        for (int i = 0; i < regs.length; i++) {
            Matcher m = Pattern.compile(regs[i], Pattern.CASE_INSENSITIVE).matcher(s);
            if (m.find()) {
                String d = m.group(1);
                try {
                    LocalDate date = (i == 2 && d.matches("\\d{2}-[A-Za-z]{3}-\\d{2}"))
                            ? LocalDate.parse(d, DateTimeFormatter.ofPattern("dd-MMM-uu", Locale.ENGLISH))
                            : LocalDate.parse(d, fmts[i]);
                    return new DateMatch(m.start(1), m.end(1), date);
                } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private AmountMatch extractAmountInLine(String s) {
        Matcher m = amountPattern().matcher(s);
        int start = -1, end = -1; String captured = null;
        while (m.find()) { start = m.start(); end = m.end(); captured = m.group(); }
        if (captured == null) return null;
        BigDecimal v = parseAmount(captured);
        return new AmountMatch(start, end, v);
    }

    private BigDecimal parseAmount(String raw) {
        String v = raw.replaceAll("[₹,\\s\\+]", "");
        boolean neg = v.startsWith("-") || v.endsWith("-") || (v.startsWith("(") && v.endsWith(")"));
        v = v.replace("-", "").replace("(", "").replace(")", "");
        BigDecimal out = new BigDecimal(v);
        return neg ? out.negate() : out;
    }

    private LocalDate parseDateFlexible(String s) {
        List<DateTimeFormatter> fmts = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/uuuu"),
                DateTimeFormatter.ofPattern("dd-MMM-uuuu", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd-MMM-uu", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("dd MMM uuuu", Locale.ENGLISH),
                DateTimeFormatter.ofPattern("d MMMM uuuu", Locale.ENGLISH), // 10 October 2025
                DateTimeFormatter.ofPattern("MMM dd, uuuu", Locale.ENGLISH)
        );
        for (DateTimeFormatter f : fmts) {
            try { return LocalDate.parse(s, f); } catch (Exception ignored) {}
        }
        throw new IllegalArgumentException("Invalid date: " + s);
    }

    private Category getOrCreateUncategorized(Long userId) {
        return categories.findByUserIdAndName(userId, "Uncategorized")
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName("Uncategorized");
                    c.setUserId(userId);
                    return categories.save(c);
                });
    }

    private String txnTypeToken(String s) {
        String u = s.toUpperCase(Locale.ROOT);
        if (u.contains("DEBIT")) return "DEBIT";
        if (u.contains("CREDIT")) return "CREDIT";
        return "";
    }

    // ---------- SuperMoney parser: "Name Bank Amount Date Status" ----------
    private List<Tx> extractSuperMoney(String text) {
        List<Tx> out = new ArrayList<>();
        String[] lines = text.split("\\R");
        boolean seenHeader = false;

        for (String raw : lines) {
            String s = clean(raw).toUpperCase(Locale.ROOT);
            if (s.contains("NAME") && s.contains("AMOUNT") && s.contains("DATE") && s.contains("STATUS")) {
                seenHeader = true;
                break;
            }
        }
        if (!seenHeader) return out;

        // Examples:
        // "GARUDA CAFE Karnataka 1601 -250.00 4 October 2025 SUCCESS"
        // "KUSHAL S M Karnataka XXXXXXXXXXXX1601 +50.00 29 September 2025 SUCCESS"
        Pattern row = Pattern.compile(
                "^(.*?)\\s+Karnataka\\s+(?:X+\\d+|\\d+)\\s+([+\\-]?\\d+(?:\\.\\d{1,2})?)\\s+(\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{4})\\s+(SUCCESS|FAILED)\\s*$",
                Pattern.CASE_INSENSITIVE);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("d MMMM uuuu", Locale.ENGLISH);

        for (String raw : lines) {
            String s = clean(raw);
            if (s.isBlank()) continue;
            String up = s.toUpperCase(Locale.ROOT);
            if (up.startsWith("TRANSACTION HISTORY")) continue;
            if (up.equals("NAME BANK AMOUNT DATE STATUS")) continue;

            Matcher m = row.matcher(s);
            if (!m.find()) continue;

            String name = m.group(1).trim();
            String amtRaw = m.group(2);
            String dateRaw = m.group(3);
            // String status = m.group(4);

            try {
                BigDecimal amt = parseAmount(amtRaw);
                // Only expenses (negative values). Skip credits.
                if (amt.signum() >= 0) continue;
                LocalDate date = LocalDate.parse(dateRaw, fmt);
                out.add(new Tx(date, name, amt.abs(), raw));
            } catch (Exception ignored) { }
        }
        return out;
    }
}