Renders fenced `mermaid` code blocks in messages as diagrams, drawn by [Pele](https://pele.run) in the page's theme.

- A block shows its plain code while it streams, and stays code when Pele cannot parse it.
- A finished diagram sits in the code block's frame, centred and laid out for its width: below 640 px a left-to-right
  chart too wide for it turns top-to-bottom when that is narrower, and what is still too wide shrinks to fit.
- The expand button opens it in a dialog, fitted to the screen, with wheel, pinch and drag to zoom and pan; the code
  button switches to the source and back; the copy button copies the source.
- Colours are Pele's CSS variables mapped onto the theme tokens, so light and dark follow without a new render.
- Pele (the `pele` package, no dependencies, about 230 kB gzipped) loads on the first finished diagram a page shows,
  not with the app.
