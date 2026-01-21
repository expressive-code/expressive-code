"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentAnalyzer = void 0;
const metadata_parser_1 = require("./metadata-parser");
const marker_matcher_1 = require("./marker-matcher");
/**
 * Analyzes documents to find code blocks and their markers
 */
class DocumentAnalyzer {
    constructor() {
        this.metadataParser = new metadata_parser_1.MetadataParser();
        this.markerMatcher = new marker_matcher_1.MarkerMatcher();
    }
    /**
     * Find all marker matches in a document
     */
    findAllMarkers(documentText) {
        const codeBlocks = this.findCodeBlocks(documentText);
        const allMatches = [];
        for (const block of codeBlocks) {
            const metadata = this.metadataParser.parse(block.metadata);
            const matches = this.markerMatcher.findMatches(block.content, metadata, block.startLine + 1 // +1 to skip the opening fence line
            );
            allMatches.push(...matches);
        }
        return allMatches;
    }
    /**
     * Find all code blocks in a document
     */
    findCodeBlocks(text) {
        const blocks = [];
        const lines = text.split('\n');
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            // Check for opening code fence (``` or ~~~)
            const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
            if (fenceMatch) {
                const fenceChar = fenceMatch[1][0];
                const fenceLength = fenceMatch[1].length;
                const metadata = fenceMatch[2].trim();
                const startLine = i;
                // Find closing fence
                let endLine = -1;
                for (let j = i + 1; j < lines.length; j++) {
                    const closeLine = lines[j];
                    // Check for matching closing fence
                    if (closeLine.match(new RegExp(`^${fenceChar}{${fenceLength},}\\s*$`))) {
                        endLine = j;
                        break;
                    }
                }
                if (endLine !== -1) {
                    const content = lines.slice(startLine + 1, endLine).join('\n');
                    blocks.push({
                        startLine,
                        endLine,
                        metadata,
                        content,
                    });
                    i = endLine + 1;
                    continue;
                }
            }
            i++;
        }
        return blocks;
    }
}
exports.DocumentAnalyzer = DocumentAnalyzer;
//# sourceMappingURL=document-analyzer.js.map