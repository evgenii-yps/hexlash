#!/usr/bin/env python3
"""
Generate Hexlash Combat System Documentation PDF from markdown docs.
Uses fpdf2 with DejaVu fonts for Cyrillic support.
"""

from fpdf import FPDF
import os
import re
from datetime import date

# Font paths
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
FONT_REGULAR = os.path.join(FONT_DIR, "DejaVuSans.ttf")
FONT_BOLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
FONT_MONO = os.path.join(FONT_DIR, "DejaVuSansMono.ttf")
FONT_MONO_BOLD = os.path.join(FONT_DIR, "DejaVuSansMono-Bold.ttf")

OUTPUT = os.path.join(os.path.dirname(__file__), "..", "Hexlash_Combat_System_Documentation.pdf")


class HexlashPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.add_font("DejaVu", "", FONT_REGULAR)
        self.add_font("DejaVu", "B", FONT_BOLD)
        self.add_font("Mono", "", FONT_MONO)
        self.add_font("Mono", "B", FONT_MONO_BOLD)
        self.set_auto_page_break(auto=True, margin=20)
        self.toc_entries = []
        self.warnings = []

    def header(self):
        if self.page_no() <= 2:
            return
        self.set_font("DejaVu", "", 7)
        self.set_text_color(128, 128, 128)
        self.cell(0, 8, "HEXLASH — Документация боевой системы", align="L")
        self.ln(10)
        self.set_text_color(0, 0, 0)

    def footer(self):
        if self.page_no() <= 1:
            return
        self.set_y(-15)
        self.set_font("DejaVu", "", 7)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"— {self.page_no()} —", align="C")
        self.set_text_color(0, 0, 0)


def make_cover(pdf):
    """Cover page."""
    pdf.add_page()
    pdf.ln(60)
    pdf.set_font("DejaVu", "B", 28)
    pdf.cell(0, 15, "HEXLASH", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    pdf.set_font("DejaVu", "", 16)
    pdf.cell(0, 10, "Документация боевой системы", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(20)
    pdf.set_font("DejaVu", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, f"Дата: {date.today().strftime('%Y-%m-%d')}", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Версия: 1.0", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "Язык: Русский", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)


def make_toc(pdf):
    """Table of contents page."""
    pdf.add_page()
    pdf.set_font("DejaVu", "B", 18)
    pdf.cell(0, 12, "Оглавление", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    toc_items = [
        ("1", "Ядро боевой системы"),
        ("1.1", "Общий флоу боя"),
        ("1.2", "Механика раунда"),
        ("1.3", "AI-стратегия"),
        ("1.4", "Генерация противника"),
        ("1.5", "Колода и модули"),
        ("2", "Спецмеханики: Dice, Coach, Emergency"),
        ("2.1", "Dice (Кубик судьбы)"),
        ("2.2", "Coach (Тренер)"),
        ("2.3", "Emergency Protocol"),
        ("2.4", "Стейт боя (cardFightState)"),
        ("3", "PvP боевой движок"),
        ("3.1", "PvP vs PvE — отличия"),
        ("3.2", "WebSocket протокол боя"),
        ("3.3", "Управление матчем"),
        ("3.4", "ELO и рейтинг"),
        ("4", "Матчмейкинг и челленджи"),
        ("4.1", "Матчмейкинг"),
        ("4.2", "Челленджи (друзья)"),
        ("5", "Auto Fight — автоматические бои"),
        ("5.1", "Механика Auto Fight"),
        ("5.2", "Офлайн и catch-up"),
        ("5.3", "Персистентность"),
        ("5.4", "Дневной ресет"),
        ("5.5", "AutoFightStatus UI"),
        ("6", "Приложения"),
        ("6.1", "Таблица приёмов (18 шт.)"),
        ("6.2", "Таблица эффектов Dice"),
        ("6.3", "Таблица констант боя"),
        ("6.4", "Сводка предупреждений"),
    ]
    for num, title in toc_items:
        is_chapter = "." not in num
        if is_chapter:
            pdf.set_font("DejaVu", "B", 11)
            indent = 0
        else:
            pdf.set_font("DejaVu", "", 10)
            indent = 8
        pdf.set_x(pdf.l_margin + indent)
        pdf.cell(0, 7, f"{num}  {title}", new_x="LMARGIN", new_y="NEXT")


# ─── Markdown rendering helpers ──────────────────────────────────────────

def render_heading(pdf, level, text):
    """Render a heading."""
    sizes = {1: 18, 2: 14, 3: 12}
    pdf.ln(4 if level > 1 else 8)
    pdf.set_font("DejaVu", "B", sizes.get(level, 11))
    pdf.multi_cell(0, 8, text)
    pdf.ln(2)
    pdf.set_font("DejaVu", "", 9)


def render_table(pdf, rows):
    """Render a markdown table."""
    if not rows or len(rows) < 2:
        return
    headers = [c.strip() for c in rows[0].strip("|").split("|")]
    data_rows = []
    for row in rows[2:]:  # skip separator
        cols = [c.strip() for c in row.strip("|").split("|")]
        data_rows.append(cols)

    num_cols = len(headers)
    if num_cols == 0:
        return

    usable = pdf.w - pdf.l_margin - pdf.r_margin
    col_w = usable / num_cols

    # Limit max column width, give more to wider content
    if num_cols <= 3:
        col_w = usable / num_cols
        col_widths = [col_w] * num_cols
    else:
        col_widths = [usable / num_cols] * num_cols

    # Header
    pdf.set_font("DejaVu", "B", 7.5)
    row_h = 6
    for i, h in enumerate(headers):
        w = col_widths[i] if i < len(col_widths) else col_widths[-1]
        pdf.cell(w, row_h, h[:40], border=1, align="C")
    pdf.ln(row_h)

    # Data
    pdf.set_font("Mono", "", 7)
    for dr in data_rows:
        max_lines = 1
        cell_texts = []
        for i, cell in enumerate(dr):
            w = col_widths[i] if i < len(col_widths) else col_widths[-1]
            # Estimate lines needed
            char_w = 3.5
            chars_per_line = max(1, int(w / char_w))
            lines = max(1, (len(cell) + chars_per_line - 1) // chars_per_line)
            max_lines = max(max_lines, lines)
            cell_texts.append(cell[:120])

        cell_h = row_h * max_lines
        if pdf.get_y() + cell_h > pdf.h - pdf.b_margin:
            pdf.add_page()

        x_start = pdf.get_x()
        y_start = pdf.get_y()
        for i, cell in enumerate(cell_texts):
            if i >= len(col_widths):
                break
            w = col_widths[i]
            if w < 5:
                continue
            pdf.set_xy(x_start + sum(col_widths[:i]), y_start)
            # Truncate to fit
            while cell and pdf.get_string_width(cell) > w * max_lines - 2:
                cell = cell[:-1]
            pdf.multi_cell(w, row_h, cell, border=1)
        pdf.set_xy(pdf.l_margin, y_start + cell_h)

    pdf.set_x(pdf.l_margin)
    pdf.ln(2)


def render_code_block(pdf, lines):
    """Render a code block."""
    pdf.set_font("Mono", "", 7)
    pdf.set_fill_color(240, 240, 240)
    for line in lines:
        if pdf.get_y() > pdf.h - pdf.b_margin - 5:
            pdf.add_page()
        pdf.cell(0, 4.5, "  " + line, new_x="LMARGIN", new_y="NEXT", fill=True)
    pdf.set_fill_color(255, 255, 255)
    pdf.ln(2)
    pdf.set_font("DejaVu", "", 9)


def strip_md_formatting(text):
    """Remove markdown bold/italic/code markers."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'`(.+?)`', r'\1', text)
    return text


def render_markdown(pdf, md_text):
    """Parse and render markdown content to PDF."""
    lines = md_text.split("\n")
    i = 0
    in_code = False
    code_lines = []
    table_rows = []

    while i < len(lines):
        line = lines[i]

        # Code block
        if line.strip().startswith("```"):
            if in_code:
                render_code_block(pdf, code_lines)
                code_lines = []
                in_code = False
            else:
                # Flush any pending table
                if table_rows:
                    render_table(pdf, table_rows)
                    table_rows = []
                in_code = True
            i += 1
            continue

        if in_code:
            code_lines.append(line)
            i += 1
            continue

        # Table row
        if "|" in line and line.strip().startswith("|"):
            table_rows.append(line)
            i += 1
            continue
        else:
            if table_rows:
                render_table(pdf, table_rows)
                table_rows = []

        stripped = line.strip()

        # Horizontal rule
        if stripped.startswith("---"):
            pdf.ln(3)
            i += 1
            continue

        # Heading
        m = re.match(r'^(#{1,3})\s+(.*)', stripped)
        if m:
            level = len(m.group(1))
            text = strip_md_formatting(m.group(2))
            render_heading(pdf, level, text)
            i += 1
            continue

        # Warning line (collect for appendix)
        if "⚠️" in stripped or "⚠" in stripped:
            clean = strip_md_formatting(stripped.lstrip("- "))
            pdf.warnings.append(clean)

        # Bold paragraph (like **Файлы:**)
        if stripped.startswith("**"):
            pdf.set_font("DejaVu", "B", 9)
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(0, 5, strip_md_formatting(stripped))
            pdf.set_font("DejaVu", "", 9)
            i += 1
            continue

        # List item
        if stripped.startswith("- ") or stripped.startswith("* "):
            text = strip_md_formatting(stripped[2:])
            pdf.set_font("DejaVu", "", 9)
            pdf.set_x(pdf.l_margin + 5)
            pdf.multi_cell(0, 5, "• " + text)
            i += 1
            continue

        # Numbered list
        m2 = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m2:
            text = strip_md_formatting(m2.group(2))
            pdf.set_font("DejaVu", "", 9)
            pdf.set_x(pdf.l_margin + 5)
            pdf.multi_cell(0, 5, f"{m2.group(1)}. {text}")
            i += 1
            continue

        # Empty line
        if not stripped:
            pdf.ln(2)
            i += 1
            continue

        # Regular paragraph
        pdf.set_font("DejaVu", "", 9)
        pdf.set_x(pdf.l_margin)
        text = strip_md_formatting(stripped)
        pdf.multi_cell(0, 5, text)
        i += 1

    # Flush remaining
    if code_lines:
        render_code_block(pdf, code_lines)
    if table_rows:
        render_table(pdf, table_rows)


# ─── Appendices ──────────────────────────────────────────────────────────

def appendix_moves(pdf):
    """6.1 — Full moves table."""
    render_heading(pdf, 2, "6.1 Таблица всех приёмов (18 шт.)")

    branches = [
        ("Speed (Скорость)", [
            ("jab", "Джэб", "8/10/12/15/18", "1.20/1.30/1.40/1.50/1.60"),
            ("double_jab", "Двойной джэб", "12/15/18/22/26", "1.10/1.20/1.30/1.40/1.50"),
            ("rapid_fire", "Скорострел", "15/18/22/27/32", "1.00/1.10/1.20/1.30/1.40"),
            ("combo_strike", "Комбо-удар", "20/24/29/35/42", "0.90/1.00/1.10/1.20/1.30"),
            ("flurry", "Шквал", "25/30/36/43/52", "0.80/0.90/1.00/1.10/1.20"),
            ("hurricane", "Ураган", "32/38/46/55/66", "0.70/0.80/0.90/1.00/1.10"),
        ]),
        ("Power (Сила)", [
            ("straight", "Прямой", "12/15/18/22/27", "0.80/0.85/0.90/0.95/1.00"),
            ("hook", "Хук", "16/20/24/29/35", "0.75/0.80/0.85/0.90/0.95"),
            ("uppercut", "Апперкот", "20/25/30/36/44", "0.70/0.75/0.80/0.85/0.90"),
            ("haymaker", "Свинг", "26/32/38/46/56", "0.60/0.65/0.70/0.75/0.80"),
            ("hammer_fist", "Молот", "32/40/48/58/70", "0.50/0.55/0.60/0.65/0.70"),
            ("knockout_blow", "Нокаут", "42/52/62/75/90", "0.40/0.45/0.50/0.55/0.60"),
        ]),
        ("Technique (Техника)", [
            ("block_strike", "Блок-удар", "10/12/15/18/22", "1.00/1.05/1.10/1.15/1.20"),
            ("counter_jab", "Контр-джэб", "14/17/21/25/30", "0.95/1.00/1.05/1.10/1.15"),
            ("feint_cross", "Обманный кросс", "18/22/27/32/39", "0.90/0.95/1.00/1.05/1.10"),
            ("parry_punish", "Парирование", "22/27/33/40/48", "0.85/0.90/0.95/1.00/1.05"),
            ("slip_counter", "Уклон-контр", "28/34/41/50/60", "0.80/0.85/0.90/0.95/1.00"),
            ("precision_strike", "Точный удар", "35/43/52/63/76", "0.75/0.80/0.85/0.90/0.95"),
        ]),
    ]

    for branch_name, moves in branches:
        pdf.set_font("DejaVu", "B", 10)
        pdf.ln(3)
        pdf.cell(0, 7, branch_name, new_x="LMARGIN", new_y="NEXT")

        # Table header
        col_w = [30, 30, 50, 50, 30]
        headers = ["ID", "Имя", "Damage (1→5)", "Speed (1→5)", "Base Power"]
        base_powers = {
            "jab": 8, "double_jab": 10, "rapid_fire": 12, "combo_strike": 14, "flurry": 16, "hurricane": 18,
            "straight": 10, "hook": 13, "uppercut": 16, "haymaker": 19, "hammer_fist": 22, "knockout_blow": 25,
            "block_strike": 9, "counter_jab": 11, "feint_cross": 13, "parry_punish": 15, "slip_counter": 17, "precision_strike": 20,
        }
        pdf.set_font("DejaVu", "B", 7)
        for j, h in enumerate(headers):
            pdf.cell(col_w[j], 5, h, border=1, align="C")
        pdf.ln(5)

        pdf.set_font("Mono", "", 7)
        for mid, mname, dmg, spd in moves:
            if pdf.get_y() > pdf.h - 20:
                pdf.add_page()
            pdf.cell(col_w[0], 5, mid, border=1)
            pdf.cell(col_w[1], 5, mname, border=1)
            pdf.cell(col_w[2], 5, dmg, border=1, align="C")
            pdf.cell(col_w[3], 5, spd, border=1, align="C")
            pdf.cell(col_w[4], 5, str(base_powers.get(mid, "")), border=1, align="C")
            pdf.ln(5)
        pdf.ln(2)


def appendix_dice(pdf):
    """6.2 — Dice effects comparison table."""
    render_heading(pdf, 2, "6.2 Таблица эффектов Dice (PvE vs PvP)")

    headers = ["Эффект", "PvE (клиент)", "PvP (сервер)"]
    col_w = [25, 80, 85]

    pdf.set_font("DejaVu", "B", 7.5)
    for j, h in enumerate(headers):
        pdf.cell(col_w[j], 6, h, border=1, align="C")
    pdf.ln(6)

    data = [
        ("heal", "+15 HP мгновенно", "+20 HP мгновенно"),
        ("adrenaline", "attackMultiplier=2 (1 раунд)", "x1.3 урона (2 раунда)"),
        ("shield", "Полный блок 1 атаки (1 раунд)", "x0.5 входящего урона (2 раунда)"),
        ("blind", "Промах противника (1 раунд)", "50% шанс промаха (2 раунда)"),
        ("rage", "-20 HP противнику мгновенно", "x1.5 урона (2 раунда)"),
        ("crit", "-30 HP противнику мгновенно", "x2 урона (1 раунд)"),
    ]

    pdf.set_font("Mono", "", 7)
    for eff, pve, pvp in data:
        pdf.cell(col_w[0], 6, eff, border=1)
        pdf.cell(col_w[1], 6, pve, border=1)
        pdf.cell(col_w[2], 6, pvp, border=1)
        pdf.ln(6)
    pdf.ln(3)


def appendix_constants(pdf):
    """6.3 — All combat constants."""
    render_heading(pdf, 2, "6.3 Таблица констант боя")

    headers = ["Константа", "Значение", "Описание"]
    col_w = [60, 35, 95]

    pdf.set_font("DejaVu", "B", 7.5)
    for j, h in enumerate(headers):
        pdf.cell(col_w[j], 6, h, border=1, align="C")
    pdf.ln(6)

    constants = [
        ("MAX_HP", "100", "Стартовое HP"),
        ("MAX_ROUNDS", "10", "Основные раунды"),
        ("EXTRA_ROUNDS", "2", "Дополнительные раунды (Overdrive)"),
        ("TOTAL_ROUNDS", "12", "MAX_ROUNDS + EXTRA_ROUNDS"),
        ("EXTRA_ROUND_DAMAGE_MULTIPLIER", "2", "Множитель урона в Overdrive"),
        ("COUNTDOWN", "3", "Секунды до боя"),
        ("ROUND_ANIMATION_MS", "1500", "Длительность анимации раунда (мс)"),
        ("BASE_DAMAGE", "15", "Базовый урон"),
        ("POSITION_BONUS", "5", "Бонус от position"),
        ("DODGE_CHANCE", "0.12", "Шанс уклонения (12%)"),
        ("CRIT_CHANCE", "0.10", "Шанс крита (10%)"),
        ("CRIT_MULT", "1.5", "Множитель крита"),
        ("DICE_COOLDOWN_ROUNDS", "3", "Кулдаун dice"),
        ("COACH_MIN_ROUND", "6", "Минимальный раунд для Coach"),
        ("COACH_TRIGGER_CHANCE", "1.0", "Шанс срабатывания Coach (100%)"),
        ("COACH_BOOST_ROUNDS", "4", "Длительность бонуса Coach"),
        ("EMERGENCY_HP_THRESHOLD", "30", "Порог HP для Emergency (30%)"),
        ("MIN_DECK_SIZE", "4", "Мин. размер колоды"),
        ("MAX_DECK_SIZE", "8", "Макс. размер колоды"),
        ("AUTO_FIGHT_MIN_INTERVAL", "3600000", "Интервал автобоя (60 мин)"),
        ("AUTO_FIGHT_MAX_INTERVAL", "3600000", "Макс. интервал (60 мин)"),
        ("AUTO_FIGHT_MAX_PER_DAY", "24", "Лимит автобоёв в день"),
        ("AUTO_FIGHT_MAX_PER_SESSION", "48", "Лимит автобоёв за сессию"),
        ("SEARCH_RANGE_INITIAL", "300", "Начальный диапазон матчмейкинга"),
        ("SEARCH_RANGE_STEP", "100", "Расширение диапазона"),
        ("SEARCH_RANGE_MAX", "1000", "Макс. диапазон"),
        ("SEARCH_TIMEOUT_MS", "120000", "Таймаут поиска (2 мин)"),
        ("DICE_PAUSE_TIMEOUT_MS", "10000", "Объявлен, но не используется"),
        ("COACH_PAUSE_TIMEOUT_MS", "10000", "Таймаут выбора Coach (PvP)"),
    ]

    pdf.set_font("Mono", "", 7)
    for name, val, desc in constants:
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
        pdf.cell(col_w[0], 5.5, name, border=1)
        pdf.cell(col_w[1], 5.5, val, border=1, align="C")
        pdf.cell(col_w[2], 5.5, desc, border=1)
        pdf.ln(5.5)
    pdf.ln(3)


def appendix_warnings(pdf):
    """6.4 — Collected warnings."""
    render_heading(pdf, 2, "6.4 Сводка предупреждений")
    pdf.set_font("DejaVu", "", 9)
    pdf.multi_cell(0, 5, "Все предупреждения (отмечены символом ⚠️), собранные из документации:")
    pdf.ln(3)

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for w in pdf.warnings:
        key = w[:80]
        if key not in seen:
            seen.add(key)
            unique.append(w)

    pdf.set_font("DejaVu", "", 8)
    for idx, w in enumerate(unique, 1):
        if pdf.get_y() > pdf.h - 20:
            pdf.add_page()
        pdf.set_x(pdf.l_margin + 3)
        pdf.multi_cell(0, 5, f"{idx}. {w}")
        pdf.ln(1)


# ─── Main ────────────────────────────────────────────────────────────────

def main():
    docs_dir = os.path.dirname(os.path.abspath(__file__))

    pdf = HexlashPDF()
    pdf.set_title("HEXLASH — Документация боевой системы")
    pdf.set_author("Hexlash Team")

    # Cover
    make_cover(pdf)

    # TOC
    make_toc(pdf)

    # Sections 1-5 from markdown files
    doc_files = [
        ("01_combat_core.md", "Раздел 1 — Ядро боевой системы"),
        ("02_dice_coach_emergency.md", "Раздел 2 — Dice, Coach, Emergency"),
        ("03a_pvp_engine.md", "Раздел 3 — PvP боевой движок"),
        ("03b_matchmaking_challenges.md", "Раздел 4 — Матчмейкинг и челленджи"),
        ("03c_autofight.md", "Раздел 5 — Auto Fight"),
    ]

    for fname, section_title in doc_files:
        fpath = os.path.join(docs_dir, fname)
        if not os.path.exists(fpath):
            print(f"WARNING: {fpath} not found, skipping")
            continue
        with open(fpath, "r", encoding="utf-8") as f:
            md = f.read()

        pdf.add_page()
        pdf.set_font("DejaVu", "B", 14)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 10, section_title, fill=True, new_x="LMARGIN", new_y="NEXT")
        pdf.set_fill_color(255, 255, 255)
        pdf.ln(4)

        render_markdown(pdf, md)

    # Section 6 — Appendices
    pdf.add_page()
    pdf.set_font("DejaVu", "B", 18)
    pdf.cell(0, 12, "Раздел 6 — Приложения", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    appendix_moves(pdf)
    appendix_dice(pdf)
    appendix_constants(pdf)
    appendix_warnings(pdf)

    output_path = os.path.abspath(OUTPUT)
    pdf.output(output_path)
    print(f"PDF generated: {output_path}")
    print(f"Total pages: {pdf.page_no()}")
    print(f"Warnings collected: {len(pdf.warnings)}")


if __name__ == "__main__":
    main()
