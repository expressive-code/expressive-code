/**
 * Expressive Code Language Server
 * 
 * This is a standard LSP (Language Server Protocol) implementation that works
 * with any editor supporting LSP (VS Code, Neovim, Emacs, etc.)
 * 
 * The 'vscode-languageserver' package implements the official LSP specification
 * (despite the name, it's not VS Code-specific).
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  SemanticTokensBuilder,
  SemanticTokensParams,
  SemanticTokens,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentAnalyzer } from './document-analyzer';
import { MarkerType } from './types';

// Create a connection using stdin/stdout (standard for LSP servers)
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents = new TextDocuments(TextDocument);

// Document analyzer - finds and highlights Expressive Code markers
const analyzer = new DocumentAnalyzer();

// Semantic token legend (as per LSP specification)
// These define the token types and modifiers this server provides
const tokenTypes = ['mark', 'inserted', 'deleted'];
const tokenModifiers = ['line', 'inline', 'label'];

/**
 * Initialize the language server
 * This is called when a client first connects to the server
 */
connection.onInitialize((params: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      // Sync full document content incrementally
      textDocumentSync: TextDocumentSyncKind.Incremental,
      
      // Provide semantic tokens for syntax highlighting
      semanticTokensProvider: {
        legend: {
          tokenTypes,
          tokenModifiers,
        },
        // Support full document semantic token requests
        full: true,
      },
    },
  };

  return result;
});

connection.onInitialized(() => {
  connection.console.log('Expressive Code LSP Server initialized');
});

/**
 * Handle semantic tokens requests
 * 
 * This is the core functionality - when the editor requests semantic tokens
 * for a document, we analyze it for Expressive Code markers and return
 * their positions and types as semantic tokens.
 */
connection.languages.semanticTokens.on((params: SemanticTokensParams): SemanticTokens => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return { data: [] };
  }

  const builder = new SemanticTokensBuilder();
  const text = document.getText();
  const markers = analyzer.findAllMarkers(text);

  // Convert each marker to a semantic token
  for (const marker of markers) {
    // Map marker type to token type index
    const tokenTypeIndex = getTokenTypeIndex(marker.type);
    
    // Build modifier bits (as per LSP spec)
    let modifierBits = 0;
    if (marker.isLineMarker) {
      modifierBits |= (1 << tokenModifiers.indexOf('line'));
    } else {
      modifierBits |= (1 << tokenModifiers.indexOf('inline'));
    }
    if (marker.label) {
      modifierBits |= (1 << tokenModifiers.indexOf('label'));
    }

    // Add the token (line, startChar, length, tokenType, modifiers)
    const line = marker.line;
    const startChar = marker.startChar;
    const length = marker.endChar - marker.startChar;

    builder.push(line, startChar, length, tokenTypeIndex, modifierBits);
  }

  return builder.build();
});

/**
 * Map marker type to semantic token type index
 */
function getTokenTypeIndex(markerType: MarkerType): number {
  switch (markerType) {
    case 'mark':
      return 0; // 'mark'
    case 'ins':
      return 1; // 'inserted'
    case 'del':
      return 2; // 'deleted'
    default:
      return 0;
  }
}

// Make the text document manager listen on the connection
// This keeps track of opened/changed/closed documents
documents.listen(connection);

// Start listening on stdin/stdout
// This is the standard way LSP servers communicate with clients
connection.listen();

connection.console.log('Expressive Code LSP Server started and listening...');
