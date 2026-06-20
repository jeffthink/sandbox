// OCR locator for image-only meet PDFs (macOS Vision framework — no install needed).
// Usage:  swift ocr-locate.swift <page-or-quadrant.png>
//
// Purpose: RECOVER TEXT so you can `grep` an image-only PDF for swimmer last names and
// event headers (completeness + location). It is NOT the source of truth for times/places —
// Vision misreads digits in dense two-column tables (e.g. 1:41.07 vs 1:41.71). Always
// confirm every recorded digit by eye from a high-res crop. See SKILL.md "Image-only PDFs".
//
// Tip: OCR the half-page-width QUADRANT crops (work/p<NN>-q<1-4>-*.png), not full pages —
// full pages put the LEFT and RIGHT result columns on the same horizontal line and Vision
// will interleave them into one garbled row. Quadrants keep each column's rows intact.

import Foundation
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
    FileHandle.standardError.write("usage: swift ocr-locate.swift <image.png>\n".data(using: .utf8)!); exit(1)
}
let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    FileHandle.standardError.write("cannot load image: \(path)\n".data(using: .utf8)!); exit(1)
}

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false   // names/codes/times are not dictionary words
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])

struct Frag { let x: Double; let y: Double; let text: String }
var frags: [Frag] = []
for obs in (req.results ?? []) {
    guard let c = obs.topCandidates(1).first else { continue }
    let bb = obs.boundingBox                       // origin bottom-left, normalized
    frags.append(Frag(x: Double(bb.minX), y: Double(1.0 - bb.maxY), text: c.string))
}
// Group fragments into visual rows by y proximity, then order each row left-to-right.
frags.sort { $0.y < $1.y }
var rows: [[Frag]] = []
let yTol = 0.008
for f in frags {
    if let last = rows.last, let ref = last.first, abs(ref.y - f.y) <= yTol {
        rows[rows.count - 1].append(f)
    } else {
        rows.append([f])
    }
}
for row in rows {
    let sorted = row.sorted { $0.x < $1.x }
    let line = sorted.map { $0.text }.joined(separator: "  ")
    let y = Int((sorted.first?.y ?? 0) * 1000)     // coarse vertical position, for ordering
    print(String(format: "%4d| %@", y, line))
}
