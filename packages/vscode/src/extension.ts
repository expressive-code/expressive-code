import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // Path to the server module (in monorepo structure)
  const serverModule = context.asAbsolutePath(
    path.join('..', 'server', 'out', 'server.js')
  );

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--nolazy', '--inspect=6009']
      }
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for markdown and mdx documents
    documentSelector: [
      { scheme: 'file', language: 'markdown' },
      { scheme: 'file', language: 'mdx' }
    ],
    synchronize: {
      // Notify the server about file changes to markdown and mdx files
      fileEvents: workspace.createFileSystemWatcher('**/*.{md,mdx}')
    }
  };

  // Create the language client and start the client
  client = new LanguageClient(
    'expressiveCodeLsp',
    'Expressive Code LSP',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();

  window.showInformationMessage('Expressive Code LSP activated!');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
