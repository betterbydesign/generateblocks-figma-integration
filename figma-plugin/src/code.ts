// src/code.ts

import { FigmaConverter } from './converter';
import { PluginMessage } from './types';

// Show UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true
});

const converter = new FigmaConverter();

figma.ui.onmessage = async (msg: PluginMessage) => {
  console.log('Plugin received message:', msg.type);

  try {
    switch (msg.type) {
      case 'html-parsed':
        await handleHtmlParsed(msg.data);
        break;

      case 'cancel':
        figma.closePlugin();
        break;

      default:
        console.log('Unhandled message type:', msg.type, msg.data);
    }
  } catch (error: any) {
    console.error('Plugin error:', error);
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
    figma.notify(`Error: ${error.message}`, { error: true });
  }
};

async function handleHtmlParsed(data: { parsed: any; name: string }) {
  const { parsed, name } = data;

  try {
    console.log('Converting pattern:', name);

    // Convert to Figma nodes
    const frame = await converter.convert(parsed);
    frame.name = name;

    // Select and zoom to the created frame
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.ui.postMessage({
      type: 'import-success',
      data: { nodeName: frame.name }
    });

    figma.notify(`Successfully imported: ${frame.name}`);
  } catch (error: any) {
    console.error('Conversion error:', error);
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
    figma.notify(`Error: ${error.message}`, { error: true });
  }
}
