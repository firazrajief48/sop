// src/lib/pdfGenerator.ts
import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";

interface FlowchartStep {
  no: number;
  aktivitas: string;
  pelaksana: { [key: string]: boolean };
  mutuBaku: {
    persyaratan: string;
    output: string;
    waktu: string;
  };
  keterangan: string;
}

// Helper function to draw flowchart symbols
function drawFlowchartSymbol(
  page: PDFPage,
  centerX: number,
  centerY: number,
  symbol: string,
  size: number
) {
  const half = size / 2;

  switch (symbol) {
    case "oval": // Start/End
      page.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: size * 0.8,
        yScale: size * 0.5,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      break;

    case "rectangle": // Process
      page.drawRectangle({
        x: centerX - half,
        y: centerY - half * 0.7,
        width: size,
        height: size * 0.7,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      break;

    case "diamond": // Decision
      // Draw diamond using lines
      const points = [
        { x: centerX, y: centerY + half }, // top
        { x: centerX + half, y: centerY }, // right
        { x: centerX, y: centerY - half }, // bottom
        { x: centerX - half, y: centerY }, // left
      ];
      
      for (let i = 0; i < points.length; i++) {
        const start = points[i];
        const end = points[(i + 1) % points.length];
        page.drawLine({
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          color: rgb(0, 0, 0),
          thickness: 1.5,
        });
      }
      break;

    case "database": // Database
      // Draw cylinder shape
      page.drawEllipse({
        x: centerX,
        y: centerY + half * 0.7,
        xScale: half,
        yScale: half * 0.3,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      
      page.drawLine({
        start: { x: centerX - half, y: centerY + half * 0.7 },
        end: { x: centerX - half, y: centerY - half * 0.7 },
        color: rgb(0, 0, 0),
        thickness: 1.5,
      });
      
      page.drawLine({
        start: { x: centerX + half, y: centerY + half * 0.7 },
        end: { x: centerX + half, y: centerY - half * 0.7 },
        color: rgb(0, 0, 0),
        thickness: 1.5,
      });
      
      page.drawEllipse({
        x: centerX,
        y: centerY - half * 0.7,
        xScale: half,
        yScale: half * 0.3,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      break;

    case "document": // Document
      // Draw rectangle with wavy bottom
      page.drawRectangle({
        x: centerX - half,
        y: centerY - half * 0.5,
        width: size,
        height: size * 0.8,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1.5,
      });
      
      // Draw wavy line at bottom (simplified as line)
      page.drawLine({
        start: { x: centerX - half, y: centerY - half * 0.5 },
        end: { x: centerX + half, y: centerY - half * 0.5 },
        color: rgb(0, 0, 0),
        thickness: 1.5,
      });
      break;

    default:
      // Default to filled square
      page.drawRectangle({
        x: centerX - 4,
        y: centerY - 4,
        width: 8,
        height: 8,
        color: rgb(0, 0, 0),
      });
  }
}

// Helper function to draw arrows
// Update helper function drawArrow untuk panah lebih tebal dan jelas

function drawArrow(
  page: PDFPage,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  curved: boolean = false
) {
  if (curved || Math.abs(endX - startX) > 5) {
    // Draw curved/angled arrow if moving between columns
    const midY = (startY + endY) / 2;
    
    // Line down from first symbol
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: startX, y: midY },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    
    // Horizontal line
    page.drawLine({
      start: { x: startX, y: midY },
      end: { x: endX, y: midY },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    
    // Line up to next symbol
    page.drawLine({
      start: { x: endX, y: midY },
      end: { x: endX, y: endY },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    
    // Arrowhead at end
    const arrowSize = 6;
    page.drawLine({
      start: { x: endX, y: endY },
      end: { x: endX - arrowSize / 2, y: endY + arrowSize },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    page.drawLine({
      start: { x: endX, y: endY },
      end: { x: endX + arrowSize / 2, y: endY + arrowSize },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
  } else {
    // Straight vertical arrow
    page.drawLine({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    
    // Arrowhead
    const arrowSize = 6;
    page.drawLine({
      start: { x: endX, y: endY },
      end: { x: endX - arrowSize / 2, y: endY + arrowSize },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
    page.drawLine({
      start: { x: endX, y: endY },
      end: { x: endX + arrowSize / 2, y: endY + arrowSize },
      color: rgb(0, 0, 0),
      thickness: 2,
    });
  }
}

// Helper to determine flowchart symbol based on step content
function determineSymbol(step: FlowchartStep, stepIdx: number, totalSteps: number): string {
  const aktivitas = step.aktivitas.toLowerCase();
  
  // First step = start (oval)
  if (stepIdx === 0) return "oval";
  
  // Last step = end (oval)
  if (stepIdx === totalSteps - 1) return "oval";
  
  // Decision keywords
  if (aktivitas.includes("validasi") || 
      aktivitas.includes("cek") || 
      aktivitas.includes("verifikasi") ||
      aktivitas.includes("review")) {
    return "diamond";
  }
  
  // Database keywords
  if (aktivitas.includes("backup") || 
      aktivitas.includes("simpan") ||
      aktivitas.includes("database") ||
      aktivitas.includes("input")) {
    return "database";
  }
  
  // Document keywords
  if (aktivitas.includes("cetak") || 
      aktivitas.includes("print") ||
      aktivitas.includes("laporan")) {
    return "document";
  }
  
  // Default = process (rectangle)
  return "rectangle";
}

// Helper function for word wrapping
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  if (!text || text.trim() === "") return [""];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

export default async function generateSOPPdf(params: {
  nomor: string;
  namaSop: string;
  tanggalPembuatan: string;
  tanggalRevisi: string;
  tanggalEfektif: string;
  dasarHukum?: string;
  kualifikasiPelaksana?: string;
  keterkaitan?: string;
  peralatanPerlengkapan?: string;
  peringatan?: string;
  pencatatanPendataan?: string;
  maksud?: string;
  tujuan?: string;
  flowchartSteps?: FlowchartStep[];
  pelaksanaColumns?: string[];
}): Promise<Uint8Array> {
  try {
    console.log("🔵 Loading PDF template...");

    const templateBytes = await fetch("/templates/sop_template.pdf").then((r) =>
      r.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(templateBytes);
    const page1 = pdfDoc.getPage(0);

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const {
      nomor,
      namaSop,
      tanggalPembuatan,
      tanggalRevisi,
      tanggalEfektif,
      dasarHukum = "",
      kualifikasiPelaksana = "",
      keterkaitan = "",
      peralatanPerlengkapan = "",
      peringatan = "",
      pencatatanPendataan = "",
      maksud = "",
      tujuan = "",
      flowchartSteps = [],
      pelaksanaColumns = [],
    } = params;

    // ========================================
    // PAGE 1: COVER / HEADER (COP)
    // ========================================
    const write = (
      page: PDFPage,
      text: string,
      x: number,
      y: number,
      size = 10,
      bold = false,
      lineHeight = 1.2
    ) => {
      if (!text || text === "-") {
        page.drawText("-", {
          x,
          y,
          size,
          font: bold ? fontBold : fontRegular,
          color: rgb(0, 0, 0),
        });
        return;
      }

      const lines = text.split("\n");
      const lineSpacing = size * lineHeight;

      lines.forEach((line, index) => {
        page.drawText(line, {
          x,
          y: y - index * lineSpacing,
          size,
          font: bold ? fontBold : fontRegular,
          color: rgb(0, 0, 0),
        });
      });
    };

    // Header fields
    write(page1, nomor, 590, 535, 10);
    write(page1, tanggalPembuatan, 590, 523, 10);
    write(page1, tanggalRevisi || "-", 590, 511, 10);
    write(page1, tanggalEfektif, 590, 498, 10);

    // Center title
    const judulWidth = fontBold.widthOfTextAtSize(namaSop, 12);
    const centerX = (page1.getWidth() - judulWidth) / 2;
    write(page1, namaSop, centerX, 405, 12, true);

    // Section fields
    write(page1, dasarHukum, 104, 369, 10, false, 1.2);
    write(page1, kualifikasiPelaksana, 495, 369, 10, false, 1.3);
    write(page1, keterkaitan, 104, 287, 10);
    write(page1, peralatanPerlengkapan, 495, 290, 10, false, 1.2);
    write(page1, peringatan, 105, 197, 10);
    write(page1, pencatatanPendataan, 495, 197, 10);
    write(page1, maksud, 140, 147, 10, false, 1.4);
    write(page1, tujuan, 140, 107, 10, false, 1.4);

    console.log("✅ Page 1 (COP) completed");

    // ========================================
    // PAGE 2: FLOWCHART TABLE
    // ========================================
    if (flowchartSteps.length > 0 && pelaksanaColumns.length > 0) {
      console.log("🔵 Creating Page 2 (Flowchart Table)...");

      const page2 = pdfDoc.addPage([937, 595]);
      const { width, height } = page2.getSize();

      const margin = 30;
      const tableWidth = width - 2 * margin;
      const tableTop = height - 60;

      const colNo = 25;
      const colAktivitas = 175;
      const pelaksanaWidth = 250;
      const colWidthPerPelaksana = pelaksanaWidth / pelaksanaColumns.length;
      const colMutuBakuTotal = 180;
      const colMutuBakuPer = colMutuBakuTotal / 3;
      const colKeterangan =
        tableWidth - colNo - colAktivitas - pelaksanaWidth - colMutuBakuTotal;

      const rowHeight = 40;
      const headerHeight = 60;

      // Draw table border
      page2.drawRectangle({
        x: margin,
        y: tableTop - headerHeight - rowHeight * flowchartSteps.length,
        width: tableWidth,
        height: headerHeight + rowHeight * flowchartSteps.length,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      // ===== HEADER ROW =====
      let currentX = margin;
      let currentY = tableTop;

      // Header: No
      page2.drawRectangle({
        x: currentX,
        y: currentY - headerHeight,
        width: colNo,
        height: headerHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      write(page2, "No", currentX + 5, currentY - 25, 10, true);
      currentX += colNo;

      // Header: Aktivitas
      page2.drawRectangle({
        x: currentX,
        y: currentY - headerHeight,
        width: colAktivitas,
        height: headerHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      write(page2, "Aktivitas", currentX + 5, currentY - 25, 10, true);
      currentX += colAktivitas;

      // Header: Pelaksana (main)
      const pelaksanaStartX = currentX;
      page2.drawRectangle({
        x: currentX,
        y: currentY - 30,
        width: pelaksanaWidth,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      write(page2, "Pelaksana", currentX + pelaksanaWidth / 2 - 20, currentY - 20, 10, true);

      // Sub-headers pelaksana
      pelaksanaColumns.forEach((col, idx) => {
        const subX = pelaksanaStartX + idx * colWidthPerPelaksana;
        page2.drawRectangle({
          x: subX,
          y: currentY - headerHeight,
          width: colWidthPerPelaksana,
          height: 30,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const words = col.split(" ");
        let line = "";
        let lineY = currentY - 45;

        for (const word of words) {
          const testLine = line + (line ? " " : "") + word;
          const textWidth = fontRegular.widthOfTextAtSize(testLine, 8);

          if (textWidth > colWidthPerPelaksana - 4 && line) {
            write(page2, line, subX + 2, lineY, 8, false);
            line = word;
            lineY -= 10;
          } else {
            line = testLine;
          }
        }
        if (line) {
          write(page2, line, subX + 2, lineY, 8, false);
        }
      });

      currentX += pelaksanaWidth;

      // Header: Mutu Baku (main)
      const mutuBakuStartX = currentX;
      page2.drawRectangle({
        x: currentX,
        y: currentY - 30,
        width: colMutuBakuTotal,
        height: 30,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      write(page2, "Mutu Baku", currentX + colMutuBakuTotal / 2 - 20, currentY - 20, 10, true);

      // Sub-headers Mutu Baku
      const mutuBakuHeaders = ["Persyaratan/\nKelengkapan", "Output", "Waktu"];

      mutuBakuHeaders.forEach((header, idx) => {
        const subX = mutuBakuStartX + idx * colMutuBakuPer;
        page2.drawRectangle({
          x: subX,
          y: currentY - headerHeight,
          width: colMutuBakuPer,
          height: 30,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const lines = header.split("\n");
        lines.forEach((line, lineIdx) => {
          write(page2, line, subX + 3, currentY - 42 - lineIdx * 10, 8, false);
        });
      });

      currentX += colMutuBakuTotal;

      // Header: Keterangan
      page2.drawRectangle({
        x: currentX,
        y: currentY - headerHeight,
        width: colKeterangan,
        height: headerHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      write(page2, "Keterangan", currentX + 5, currentY - 25, 10, true);

      // ===== DATA ROWS WITH FLOWCHART =====
      currentY = tableTop - headerHeight;

      // Store positions for drawing arrows later
      const stepPositions: Array<{
        x: number;
        y: number;
        colIdx: number;
      }> = [];

      flowchartSteps.forEach((step, stepIdx) => {
        currentX = margin;

        // No
        page2.drawRectangle({
          x: currentX,
          y: currentY - rowHeight,
          width: colNo,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        write(page2, String(step.no), currentX + 10, currentY - 25, 10, false);
        currentX += colNo;

        // Aktivitas
        page2.drawRectangle({
          x: currentX,
          y: currentY - rowHeight,
          width: colAktivitas,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        const aktivitasLines = wrapText(step.aktivitas, colAktivitas - 10, fontRegular, 8);
        aktivitasLines.slice(0, 3).forEach((line, lineIdx) => {
          write(page2, line, currentX + 5, currentY - 15 - lineIdx * 10, 8, false);
        });
        currentX += colAktivitas;

        // Pelaksana columns WITH FLOWCHART SYMBOLS
        const pelaksanaBaseX = currentX;
        
        pelaksanaColumns.forEach((col, idx) => {
          const subX = currentX + idx * colWidthPerPelaksana;
          page2.drawRectangle({
            x: subX,
            y: currentY - rowHeight,
            width: colWidthPerPelaksana,
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          if (step.pelaksana[col]) {
            const centerX = subX + colWidthPerPelaksana / 2;
            const centerY = currentY - rowHeight / 2;

            // Store position for arrow drawing
            stepPositions.push({ x: centerX, y: centerY, colIdx: idx });

            // Determine and draw symbol
            const symbol = determineSymbol(step, stepIdx, flowchartSteps.length);
            drawFlowchartSymbol(page2, centerX, centerY, symbol, 18);
          }
        });

        currentX += pelaksanaWidth;

        // Mutu Baku
        const mutuBakuValues = [
          step.mutuBaku.persyaratan,
          step.mutuBaku.output,
          step.mutuBaku.waktu,
        ];

        mutuBakuValues.forEach((value, idx) => {
          const subX = currentX + idx * colMutuBakuPer;
          page2.drawRectangle({
            x: subX,
            y: currentY - rowHeight,
            width: colMutuBakuPer,
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          const lines = wrapText(value, colMutuBakuPer - 6, fontRegular, 8);
          lines.slice(0, 3).forEach((line, lineIdx) => {
            write(page2, line, subX + 3, currentY - 15 - lineIdx * 10, 8, false);
          });
        });
        currentX += colMutuBakuTotal;

        // Keterangan
        page2.drawRectangle({
          x: currentX,
          y: currentY - rowHeight,
          width: colKeterangan,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        const keteranganLines = wrapText(step.keterangan, colKeterangan - 10, fontRegular, 8);
        keteranganLines.slice(0, 3).forEach((line, lineIdx) => {
          write(page2, line, currentX + 5, currentY - 15 - lineIdx * 10, 8, false);
        });

        currentY -= rowHeight;
      });

      // Draw arrows between steps (after all rows drawn)
      // Draw arrows between steps (after all rows drawn)
      for (let i = 0; i < flowchartSteps.length - 1; i++) {
        const currentStep = flowchartSteps[i];
        const nextStep = flowchartSteps[i + 1];
        
        // Get all active columns for current step
        const currentActiveColumns: Array<{ colIdx: number; x: number; y: number }> = [];
        pelaksanaColumns.forEach((col, colIdx) => {
          if (currentStep.pelaksana[col]) {
            const subX = margin + colNo + colAktivitas + colIdx * colWidthPerPelaksana;
            const centerX = subX + colWidthPerPelaksana / 2;
            const centerY = tableTop - headerHeight - (i * rowHeight) - rowHeight / 2;
            currentActiveColumns.push({ colIdx, x: centerX, y: centerY });
          }
        });
        
        // Get all active columns for next step
        const nextActiveColumns: Array<{ colIdx: number; x: number; y: number }> = [];
        pelaksanaColumns.forEach((col, colIdx) => {
          if (nextStep.pelaksana[col]) {
            const subX = margin + colNo + colAktivitas + colIdx * colWidthPerPelaksana;
            const centerX = subX + colWidthPerPelaksana / 2;
            const centerY = tableTop - headerHeight - ((i + 1) * rowHeight) - rowHeight / 2;
            nextActiveColumns.push({ colIdx, x: centerX, y: centerY });
          }
        });
        
        // Draw arrows based on the number of symbols
        if (currentActiveColumns.length === 1 && nextActiveColumns.length === 1) {
          // Simple case: 1 to 1
          const start = currentActiveColumns[0];
          const end = nextActiveColumns[0];
          const isCurved = Math.abs(start.colIdx - end.colIdx) > 0;
          drawArrow(page2, start.x, start.y - 12, end.x, end.y + 12, isCurved);
          
        } else if (currentActiveColumns.length === 1 && nextActiveColumns.length > 1) {
          // 1 to many: draw from single symbol to all next symbols
          const start = currentActiveColumns[0];
          nextActiveColumns.forEach((end) => {
            const isCurved = Math.abs(start.colIdx - end.colIdx) > 0;
            drawArrow(page2, start.x, start.y - 12, end.x, end.y + 12, isCurved);
          });
          
        } else if (currentActiveColumns.length > 1 && nextActiveColumns.length === 1) {
          // Many to 1: draw from all current symbols to single next symbol
          const end = nextActiveColumns[0];
          currentActiveColumns.forEach((start) => {
            const isCurved = Math.abs(start.colIdx - end.colIdx) > 0;
            drawArrow(page2, start.x, start.y - 12, end.x, end.y + 12, isCurved);
          });
          
        } else {
          // Many to many: connect each to nearest or use smart routing
          // Option 1: Connect same column indices
          const maxLen = Math.max(currentActiveColumns.length, nextActiveColumns.length);
          
          for (let j = 0; j < maxLen; j++) {
            const start = currentActiveColumns[Math.min(j, currentActiveColumns.length - 1)];
            const end = nextActiveColumns[Math.min(j, nextActiveColumns.length - 1)];
            
            if (start && end) {
              const isCurved = Math.abs(start.colIdx - end.colIdx) > 0;
              drawArrow(page2, start.x, start.y - 12, end.x, end.y + 12, isCurved);
            }
          }
        }
      }

      console.log("✅ Page 2 (Flowchart Table) completed");
    }

    console.log("💾 Saving final PDF...");
    const output = await pdfDoc.save();
    console.log("✅ PDF Generated:", output.length, "bytes");

    return output;
  } catch (err) {
    console.error("❌ PDF generator error:", err);
    throw err;
  }
}