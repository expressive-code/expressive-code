"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataParser = void 0;
/**
 * Parses the metadata string from a code fence (e.g., ```js {1, 4-6} "text")
 */
class MetadataParser {
    /**
     * Parse the full metadata string from a code fence
     */
    parse(metaString) {
        const result = {
            language: '',
            lineMarkers: [],
            inlineMarkers: [],
            useDiffSyntax: false,
        };
        // Extract language and check for diff
        const langMatch = metaString.match(/^(\S+)/);
        if (langMatch) {
            result.language = langMatch[1];
            result.useDiffSyntax = result.language === 'diff';
        }
        // Check for lang="..." attribute (used with diff)
        const diffLangMatch = metaString.match(/lang=["']([^"']+)["']/);
        if (diffLangMatch) {
            result.diffLanguage = diffLangMatch[1];
        }
        // Parse line markers: {1, 4-6}, ins={1-3}, del={5}, mark={7}
        result.lineMarkers = this.parseLineMarkers(metaString);
        // Parse inline markers: "text", 'text', /regex/
        result.inlineMarkers = this.parseInlineMarkers(metaString);
        return result;
    }
    /**
     * Parse line markers like {1, 4-6}, ins={1-3}, del={5}
     */
    parseLineMarkers(metaString) {
        const markers = [];
        // Pattern to match line markers: (type=)?{"label":}?{range}
        // Examples: {1,4-6}, ins={1-3}, del={"Remove":5-7}
        const lineMarkerPattern = /(?:(mark|ins|del)=)?(?:\{(?:"([^"]+)"|'([^']+)'):)?(\{[^}]+\})/g;
        let match;
        while ((match = lineMarkerPattern.exec(metaString)) !== null) {
            const type = match[1] || 'mark';
            const label = match[2] || match[3]; // either double or single quoted
            const rangeString = match[4].slice(1, -1); // remove { }
            const ranges = this.parseLineRanges(rangeString);
            if (ranges.length > 0) {
                markers.push({ type, ranges, label });
            }
        }
        return markers;
    }
    /**
     * Parse line ranges like "1, 4-6, 8" into array of {start, end} objects
     */
    parseLineRanges(rangeString) {
        const ranges = [];
        const parts = rangeString.split(',').map(s => s.trim());
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(s => parseInt(s.trim(), 10));
                if (!isNaN(start) && !isNaN(end)) {
                    ranges.push({ start, end });
                }
            }
            else {
                const line = parseInt(part, 10);
                if (!isNaN(line)) {
                    ranges.push({ start: line, end: line });
                }
            }
        }
        return ranges;
    }
    /**
     * Parse inline text markers: "text", 'text', /regex/
     * Can be prefixed with type: ins="text", del=/regex/
     */
    parseInlineMarkers(metaString) {
        const markers = [];
        // First, remove line marker sections to avoid confusion
        const withoutLineMarkers = metaString.replace(/(?:mark|ins|del)?=?\{[^}]+\}/g, '');
        // Parse string patterns: (type=)?"text" or (type=)'text'
        // We need to match both double and single quoted strings separately
        const doubleQuotePattern = /(?:(mark|ins|del)=)?"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        const singleQuotePattern = /(?:(mark|ins|del)=)?'([^'\\]*(?:\\.[^'\\]*)*)'/g;
        let match;
        // Match double-quoted strings
        while ((match = doubleQuotePattern.exec(withoutLineMarkers)) !== null) {
            const type = match[1] || 'mark';
            const pattern = match[2];
            // Unescape quotes
            const unescapedPattern = pattern.replace(/\\(.)/g, '$1');
            markers.push({
                type,
                pattern: unescapedPattern,
                isRegex: false,
            });
        }
        // Match single-quoted strings
        while ((match = singleQuotePattern.exec(withoutLineMarkers)) !== null) {
            const type = match[1] || 'mark';
            const pattern = match[2];
            // Unescape quotes
            const unescapedPattern = pattern.replace(/\\(.)/g, '$1');
            markers.push({
                type,
                pattern: unescapedPattern,
                isRegex: false,
            });
        }
        // Parse regex patterns: (type=)?/pattern/
        const regexPattern = /(?:(mark|ins|del)=)?\/([^/]*(?:\\.[^/]*)*)\/(?![a-z])/g;
        while ((match = regexPattern.exec(withoutLineMarkers)) !== null) {
            const type = match[1] || 'mark';
            const pattern = match[2];
            // Unescape forward slashes
            const unescapedPattern = pattern.replace(/\\\//g, '/');
            markers.push({
                type,
                pattern: unescapedPattern,
                isRegex: true,
            });
        }
        return markers;
    }
}
exports.MetadataParser = MetadataParser;
//# sourceMappingURL=metadata-parser.js.map