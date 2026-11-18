# 🧠 GATE 2027 — General Aptitude (GA) 3D Glassmorphic Mindmap

> **Turning a flat, overwhelming linear syllabus PDF into a spatially organized, psychologically appealing, interactive 3D knowledge map.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2F7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Flow](https://img.shields.io/badge/%40xyflow%2Freact-13-FF0072?style=flat-square)](https://reactflow.dev/)
[![ELKjs](https://img.shields.io/badge/Layout-ELKjs-7C3AED?style=flat-square)](https://github.com/kieler/elkjs)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📖 English Overview

### 1. The Problem — Why Static Syllabus PDFs Fail Our Brain
When preparing for **GATE 2027**, the very first thing every aspirant opens is the official syllabus PDF. On paper, it looks simple—just a few paragraphs under four sections. But in practice, **linear text is terrible for human cognition**:

- **Cognitive Overload:** Flat bullet lists and comma-separated paragraphs (`"ratios, percentages, powers, exponents and logarithms, permutations and combinations, and series. Mensuration and geometry, Elementary statistics and probability."`) blur together. Your brain struggles to see *where one concept ends and another begins*.
- **Hidden Hierarchy:** Plain text hides parent-child relationships. You can't instantly tell what is a **Section**, what is an **Official Topic**, what is a **Conceptual Cluster**, and what is an **Atomic Micro-topic**.
- **Zero Spatial Anchoring:** Human memory is naturally spatial and visual. Staring at a monochrome PDF gives you no visual landmarks, no progress feedback, and no dopamine loop to sustain months of preparation.

### 2. The Solution — A Psychologically Appealing 3D Visual System
I built this project to transform the **official GATE 2027 General Aptitude (`GA`) syllabus (IIT Madras)** into an **interactive, 3D glassmorphic mindmap** engineered around how the brain actually learns and retains structure:

1. **100% Verbatim-Audited Decimal Hierarchy (`1.1.1.1` → `4.1.2.3`):**  
   Every single word from the official PDF is preserved verbatim and mapped into a strict parent-child tree—resolving punctuation boundaries (colons `:`, periods `.`, and conceptual clusters) so nothing is ambiguous.
2. **Branch Color Psychology & Visual Chunking:**  
   Each of the 4 official sections owns a distinct, low-glare color family:
   - 🟢 **Verbal Aptitude (`Emerald`):** Grammar, Vocabulary, Comprehension & Sequencing
   - 🟡 **Quantitative Aptitude (`Amber`):** Data Interpretation, Numerical Computation, Mensuration & Geometry, Stats & Probability
   - 🟣 **Analytical Aptitude (`Violet`):** Logic (Deduction/Induction), Analogy, Numerical Relations
   - 🔴 **Spatial Aptitude (`Coral / Rose`):** Shape Transformations, 2D/3D Folding, Cutting & Patterns
3. **3D Glassmorphism & Tactile Depth:**  
   Frosted glass cards (`backdrop-filter: blur`), cursor-reactive 3D perspective tilt, specular rim highlights, and glowing cubic Bézier paths make exploring the syllabus feel like using a modern spatial cockpit rather than reading a dry exam circular.
4. **Built for Active Study, Not Just Pretty Screenshots:**
   - **3 Auto-Layouts (via `elkjs`):** *Balanced Two-Sided Mindmap*, *Horizontal Logic Tree*, and *Top-Down Org Chart*.
   - **Mastery Tracker:** Click any leaf dot to cycle `To Do → Learning → Mastered` with live section & overall progress rings (`localStorage` persisted).
   - **Inspector Drawer:** Click any node to view its exact breadcrumb path, official PDF audit context, subtree isolation (`Focus Mode`), and auto-saved personal study notes.
   - **Instant Search (`/`), Zen Mode (`Z`), Dark/Light Glass Toggle, & Exports (`PNG`, `Markdown`, `JSON`).**

---

## 🇮🇳 Hinglish Version (Mere Words Mein — Problem aur Solution)

### 1. Asli Problem Kya Thi?
Jab hum **GATE 2027** ki tayyari shuru karte hain, toh sabse pehle official syllabus PDF kholte hain. Dekhne mein woh sirf ek page ka text lagta hai, lekin padhte waqt **dimag mein clarity nahi banti**:
- **Linear Text = Brain Fatigue:** Ek hi line mein 8–10 topics commas aur full-stops ke saath chipke hote hain. Yeh samajh hi nahi aata ki kaunsa **main topic** hai, kaunsa **subtopic** hai, aur kis unit ko alag chapter ki tarah padhna hai.
- **Koi Visual Map Nahi:** Hamara dimag cheezon ko **branches, colors, aur spatial positions** ke form mein yaad rakhta hai, na ki plain black-and-white paragraphs mein.
- **Progress Track Karne Ka Koi System Nahi:** PDF dekh kar yeh feel hi nahi aata ki kitna syllabus cover ho gaya aur kitna baaki hai.

### 2. Maine Iska Solution Kaise Banaya?
Maine socha — *kyun na is boring linear syllabus ko ek aisi **3D Glassmorphic Mindmap** mein badal diya jaye jo dekhne mein bhi crisp lage aur dimag ke liye bhi natural ho?*

- **Pehle PDF Audit, Phir Hierarchy:** Maine official IIT Madras `GA` PDF ko line-by-line audit karke har word ko **100% verbatim** rakha, aur unke beech ke exact relationships nikal kar ek clean decimal tree (`1.1.1.1` se `4.1.2.3`) banayi.
- **4 Alag Color Branches:** Verbal (Emerald), Quant (Amber), Analytical (Violet), aur Spatial (Rose/Coral) — har branch ka apna glow aur color hai taaki ek nazar mein poori structure dimag mein chhap jaye.
- **3D Glassmorphism + Interactive Cockpit:** Cards par subtle 3D cursor tilt, frosted glass depth, aur glowing Bézier connectors lagaye hain. Iske saath:
  - **3 Layouts:** `Balanced` (center hub ke dono taraf wings), `Tree` (left-to-right), aur `Org` (top-down).
  - **Study Tracker & Notes:** Har topic ko `To Do → Learning → Mastered` mark kar sakte ho, apne formula/PYQ notes save kar sakte ho (`localStorage` mein auto-save), aur kisi ek branch ko isolate karke focus kar sakte ho.
  - **Search (`/`), Dark/Light Glass Mode, Zen Mode (`Z`), aur PNG / Markdown / JSON Export** sab inbuilt hai.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Graph & Canvas Engine:** `@xyflow/react` (React Flow)
- **Deterministic Auto-Layout:** `elkjs` (`layered` algorithm — `RIGHT`, `LEFT`, `DOWN` with zero node overlap)
- **Styling:** Tailwind CSS v4 + Custom CSS 3D Perspective & Frosted Glassmorphism
- **Icons & Export:** `lucide-react`, `html-to-image`

---

## 🚀 Run Locally

```bash
git clone https://github.com/Luqmandanish-work/gate-2027-ga-mindmap.git
cd gate-2027-ga-mindmap
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 📂 Project Structure

```text
src/
├── components/
│   ├── CommandHud.tsx         # Top floating search, layout switcher, theme & zen controls
│   ├── GlassSyllabusNode.tsx  # 3D tilt glassmorphic node cards + mastery dot + collapse pill
│   ├── GlowBezierEdge.tsx     # Branch-colored cubic Bézier connectors with active flow pulse
│   ├── InspectorDrawer.tsx    # Breadcrumbs, PDF audit context, subtree isolation & study notes
│   └── ProgressHud.tsx        # Overall mastery ring, status filters & PNG/MD/JSON export
├── data/
│   └── gaSyllabus.ts          # 100% PDF-audited GATE 2027 GA syllabus tree & branch palettes
├── types/
│   └── syllabus.ts            # TypeScript interfaces for tree nodes, layouts & mastery state
├── utils/
│   ├── elkLayout.ts           # ELKjs layout engine (Balanced, Horizontal Tree & Org modes)
│   └── treeHelpers.ts         # Indexing, ancestor/descendant focus sets & Markdown export
├── App.tsx
└── index.css
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus topic / ID search |
| `F` | Fit entire mindmap to viewport |
| `Z` | Toggle Zen Focus Mode |
| `Esc` | Close Inspector / clear selection |

---

<p align="center">
  Built with clarity & craft by <strong>Luqman Danish</strong> for GATE 2027 aspirants.
</p>
