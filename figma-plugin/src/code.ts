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
  try {
    switch (msg.type) {
      case 'html-parsed':
        await handleHtmlParsed(msg.data);
        break;

      case 'cancel':
        figma.closePlugin();
        break;
    }
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
  }
};

async function handleHtmlParsed(data: { parsed: any; name: string }) {
  const { parsed, name } = data;

  try {
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
    figma.ui.postMessage({
      type: 'error',
      data: { message: error.message }
    });
    figma.notify(`Error: ${error.message}`, { error: true });
  }
}
