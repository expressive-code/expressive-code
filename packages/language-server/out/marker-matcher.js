"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkerMatcher = void 0;
/**
 * Matches markers in code block content and returns positions for semantic tokens
 */
class MarkerMatcher {
    /**
     * Find all marker matches in a code block
     * @param content The code block content (lines between fences)
     * @param metadata The parsed metadata from the code fence
     * @param startLine The starting line number of the code block (0-indexed in document)
     * @returns Array of marker matches with positions
     */
    findMatches(content, metadata, startLine) {
        const matches = [];
        const lines = content.split('\n');
        // Process line markers
        for (const lineMarker of metadata.lineMarkers) {
            for (const range of lineMarker.ranges) {
                for (let lineNum = range.start; lineNum <= range.end; lineNum++) {
                    const lineIndex = lineNum - 1; // Convert to 0-indexed
                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        const line = lines[lineIndex];
                        matches.push({
                            type: lineMarker.type,
                            line: startLine + lineIndex,
                            startChar: 0,
                            endChar: line.length,
                            isLineMarker: true,
                            label: lineMarker.label,
                        });
                    }
                }
            }
        }
        // Process inline text markers
        for (const inlineMarker of metadata.inlineMarkers) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineMatches = this.findInlineMatches(line, inlineMarker.pattern, inlineMarker.isRegex, inlineMarker.type);
                for (const match of lineMatches) {
                    matches.push({
                        type: inlineMarker.type,
                        line: startLine + i,
                        startChar: match.start,
                        endChar: match.end,
                        isLineMarker: false,
                    });
                }
            }
        }
        // Process diff-like syntax
        if (metadata.useDiffSyntax) {
            const diffMatches = this.findDiffMarkers(lines, startLine);
            matches.push(...diffMatches);
        }
        return matches;
    }
    /**
     * Find inline matches for a pattern in a line
     */
    findInlineMatches(line, pattern, isRegex, type) {
        const matches = [];
        if (isRegex) {
            try {
                const regex = new RegExp(pattern, 'g');
                let match;
                while ((match = regex.exec(line)) !== null) {
                    // If there are capture groups, only highlight the captured content
                    if (match.length > 1) {
                        // Find the first non-undefined capture group
                        for (let i = 1; i < match.length; i++) {
                            if (match[i] !== undefined) {
                                const captureStart = match.index + match[0].indexOf(match[i]);
                                matches.push({
                                    start: captureStart,
                                    end: captureStart + match[i].length,
                                });
                                break;
                            }
                        }
                    }
                    else {
                        // No capture groups, highlight the entire match
                        matches.push({
                            start: match.index,
                            end: match.index + match[0].length,
                        });
                    }
                }
            }
            catch (error) {
                // Invalid regex, skip
                console.error('Invalid regex pattern:', pattern, error);
            }
        }
        else {
            // Plain text search
            let index = 0;
            while ((index = line.indexOf(pattern, index)) !== -1) {
                matches.push({
                    start: index,
                    end: index + pattern.length,
                });
                index += pattern.length;
            }
        }
        return matches;
    }
    /**
     * Find diff markers (lines starting with + or -)
     * Detects actual diff file format to avoid modifying real diffs
     */
    findDiffMarkers(lines, startLine) {
        const matches = [];
        // Check if this is an actual diff file (has diff metadata)
        const hasActualDiffMetadata = lines.some(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('***') ||
                trimmed.startsWith('+++') ||
                trimmed.startsWith('---') ||
                trimmed.startsWith('@@') ||
                /^\d+(,\d+)?[acd]\d+(,\d+)?$/.test(trimmed); // default mode syntax
        });
        if (hasActualDiffMetadata) {
            // This is an actual diff file, don't process it
            return matches;
        }
        // Process as diff-like syntax
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check for + or - at the start (with optional whitespace after)
            if (line.startsWith('+')) {
                matches.push({
                    type: 'ins',
                    line: startLine + i,
                    startChar: 0,
                    endChar: line.length,
                    isLineMarker: true,
                });
            }
            else if (line.startsWith('-')) {
                matches.push({
                    type: 'del',
                    line: startLine + i,
                    startChar: 0,
                    endChar: line.length,
                    isLineMarker: true,
                });
            }
        }
        return matches;
    }
}
exports.MarkerMatcher = MarkerMatcher;
//# sourceMappingURL=marker-matcher.js.map