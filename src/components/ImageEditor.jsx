import {
  useEffect,
  useRef,
  useState,
} from "react";

import { createWorker } from "tesseract.js";

export default function ImageEditor() {
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [displaySize, setDisplaySize] =
  useState({
    width: 0,
    height: 0,
  });
  const [textRegions, setTextRegions] =
    useState([]);

  const [selectedRegionId, setSelectedRegionId] =
    useState(null);

  const [editedText, setEditedText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");


  /* =====================================================
     GROUP OCR WORDS INTO LINES
     ===================================================== */

  function groupWordsIntoLines(words) {
    if (!words.length) {
      return [];
    }

    const sortedWords =
      [...words].sort((a, b) => {
        if (
          Math.abs(a.y - b.y) < 15
        ) {
          return a.x - b.x;
        }

        return a.y - b.y;
      });

    const lines = [];

    sortedWords.forEach((word) => {
      let matchingLine = null;

      for (const line of lines) {
        const lineY =
          line.y + line.height / 2;

        const wordY =
          word.y + word.height / 2;

        const difference =
          Math.abs(lineY - wordY);

        const allowed =
          Math.max(
            line.height,
            word.height
          ) * 0.6;

        if (difference <= allowed) {
          matchingLine = line;
          break;
        }
      }

      if (!matchingLine) {
        lines.push({
          words: [word],
          y: word.y,
          height: word.height,
        });

        return;
      }

      matchingLine.words.push(word);

      const top = Math.min(
        matchingLine.y,
        word.y
      );

      const bottom = Math.max(
        matchingLine.y +
          matchingLine.height,
        word.y + word.height
      );

      matchingLine.y = top;
      matchingLine.height =
        bottom - top;
    });

    return lines
      .map((line, index) => {
        const wordsInLine =
          [...line.words].sort(
            (a, b) => a.x - b.x
          );

        const x =
          wordsInLine[0].x;

        const y = Math.min(
          ...wordsInLine.map(
            (word) => word.y
          )
        );

        const right = Math.max(
          ...wordsInLine.map(
            (word) =>
              word.x + word.width
          )
        );

        const bottom = Math.max(
          ...wordsInLine.map(
            (word) =>
              word.y + word.height
          )
        );

        return {
          id: index,

          text: wordsInLine
            .map(
              (word) => word.text
            )
            .join(" "),

          x,

          y,

          width: right - x,

          height: bottom - y,

          confidence:
            wordsInLine.reduce(
              (sum, word) =>
                sum + word.confidence,
              0
            ) /
            wordsInLine.length,
        };
      })
      .sort(
        (a, b) => a.y - b.y
      );
  }


  /* =====================================================
     SELECT REGION
     ===================================================== */

  function selectRegion(region) {
    setSelectedRegionId(region.id);
    setEditedText(region.text);
  }


  /* =====================================================
     GET BACKGROUND COLOR
     
     Used for the first version of image editing.
     We sample pixels around the text box and use the
     surrounding color to cover the original text.
     ===================================================== */

  function getBackgroundColor(
    ctx,
    region,
    canvasWidth,
    canvasHeight
  ) {
    const padding = 3;

    const samples = [];

    function sampleArea(
      x,
      y,
      width,
      height
    ) {
      if (
        width <= 0 ||
        height <= 0
      ) {
        return;
      }

      const data =
        ctx.getImageData(
          Math.max(0, x),
          Math.max(0, y),
          Math.min(
            width,
            canvasWidth -
              Math.max(0, x)
          ),
          Math.min(
            height,
            canvasHeight -
              Math.max(0, y)
          )
        ).data;

      for (
        let i = 0;
        i < data.length;
        i += 4
      ) {
        samples.push([
          data[i],
          data[i + 1],
          data[i + 2],
        ]);
      }
    }


    /*
     * Sample above the text.
     */

    sampleArea(
      region.x,
      region.y - padding,
      region.width,
      padding
    );


    /*
     * Sample below the text.
     */

    sampleArea(
      region.x,
      region.y +
        region.height,
      region.width,
      padding
    );


    /*
     * Sample left.
     */

    sampleArea(
      region.x - padding,
      region.y,
      padding,
      region.height
    );


    /*
     * Sample right.
     */

    sampleArea(
      region.x +
        region.width,
      region.y,
      padding,
      region.height
    );


    if (!samples.length) {
      return {
        r: 255,
        g: 255,
        b: 255,
      };
    }


    /*
     * Average surrounding pixels.
     */

    const total =
      samples.reduce(
        (sum, rgb) => ({
          r:
            sum.r + rgb[0],
          g:
            sum.g + rgb[1],
          b:
            sum.b + rgb[2],
        }),
        {
          r: 0,
          g: 0,
          b: 0,
        }
      );


    return {
      r:
        Math.round(
          total.r /
            samples.length
        ),

      g:
        Math.round(
          total.g /
            samples.length
        ),

      b:
        Math.round(
          total.b /
            samples.length
        ),
    };
  }


  /* =====================================================
     DRAW EDITED IMAGE
     ===================================================== */

  async function drawEditedImage() {
    if (!image || !imageSize.width || !imageSize.height) {
      return false;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return false;
    }

    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = image;
    });

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return false;
    }

    /*
     * Keep the real canvas at the original image resolution.
     * CSS scales it responsively without changing the export size.
     */
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      img,
      0,
      0,
      canvas.width,
      canvas.height
    );

    /*
     * Draw only regions whose text was changed.
     */
    textRegions.forEach((region) => {
      const originalText =
        region.originalText ?? region.text;

      if (
        !region.edited ||
        region.text === originalText
      ) {
        return;
      }

      const bg = getBackgroundColor(
        ctx,
        region,
        canvas.width,
        canvas.height
      );

      /*
       * Cover the original OCR text.
       */
      ctx.fillStyle =
        `rgb(${bg.r}, ${bg.g}, ${bg.b})`;

      const coverPadding = Math.max(
        2,
        Math.round(region.height * 0.08)
      );

      ctx.fillRect(
        Math.max(0, region.x - coverPadding),
        Math.max(0, region.y - coverPadding),
        Math.min(
          canvas.width - Math.max(0, region.x - coverPadding),
          region.width + coverPadding * 2
        ),
        Math.min(
          canvas.height - Math.max(0, region.y - coverPadding),
          region.height + coverPadding * 2
        )
      );

      /*
       * Use the OCR box height to estimate replacement font size.
       */
      const fontSize = Math.max(
        10,
        Math.round(region.height * 0.9)
      );

      ctx.font =
        `700 ${fontSize}px Arial, sans-serif`;

      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";

      const centerY =
        region.y + region.height / 2;

      ctx.fillText(
        region.text,
        region.x,
        centerY
      );
    });

    return true;
  }

  /* =====================================================
     RENDER CANVAS WHEN TEXT CHANGES
     ===================================================== */

  useEffect(() => {
    if (!image) {
      return;
    }

    drawEditedImage();
  }, [
    image,
    imageSize,
    textRegions,
  ]);


  /* =====================================================
     PROCESS IMAGE
     ===================================================== */

  async function processImage(file) {
    if (!file) {
      return;
    }


    if (
      ![
        "image/png",
        "image/jpeg",
      ].includes(file.type)
    ) {
      setError(
        "Please upload a PNG or JPG image."
      );

      return;
    }


    setError("");

    setLoading(true);

    setProgress(0);

    setTextRegions([]);

    setSelectedRegionId(null);

    setEditedText("");


    const imageUrl =
      URL.createObjectURL(file);

    setImage((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return imageUrl;
    });

    setFileName(file.name);


    const img =
      new Image();


    img.onload = () => {
      setImageSize({
        width:
          img.naturalWidth,

        height:
          img.naturalHeight,
      });
    };


    img.src = imageUrl;


    try {
      const worker =
        await createWorker(
          "eng",
          1,
          {
            logger: (message) => {
              if (
                message.status ===
                  "recognizing text" &&
                typeof message.progress ===
                  "number"
              ) {
                setProgress(
                  Math.round(
                    message.progress *
                      100
                  )
                );
              }
            },
          }
        );


      /*
       * =====================================================
       * MULTI-PASS OCR + TARGETED DARK-TEXT DETECTION
       * =====================================================
       *
       * The uploaded image is never modified.
       *
       * We use:
       *  1. Original OCR
       *  2. 2x OCR
       *  3. Contrast OCR
       *  4. Grayscale OCR
       *  5. Tight connected dark-text regions
       *
       * The dark-text detector is deliberately conservative:
       * it looks for compact dark components inside the main
       * image area, merges nearby characters into words/phrases,
       * removes large artwork/background components, and sends
       * only tight crops to Tesseract.
       */

      const OCR_SCALE = 2;

      const clamp = (value, min, max) =>
        Math.max(min, Math.min(max, value));

      const normalizeOCRText = (value) =>
        String(value || "")
          .replace(/\s+/g, " ")
          .trim();

      const isLikelyOCRNoise = (text) => {
        const value =
          normalizeOCRText(text);

        if (!value) return true;

        if (
          value.length <= 1 &&
          !/[A-Za-z0-9]/.test(value)
        ) {
          return true;
        }

        /*
         * Common garbage produced from lines/artwork.
         */
        if (
          /^[^A-Za-z0-9]+$/.test(value)
        ) {
          return true;
        }

        return false;
      };


      function createOCRVariant(
        sourceFile,
        mode
      ) {
        return new Promise(
          (resolve, reject) => {
            const url =
              URL.createObjectURL(
                sourceFile
              );

            const sourceImage =
              new Image();

            sourceImage.onload =
              () => {
                URL.revokeObjectURL(
                  url
                );

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                const scale =
                  OCR_SCALE;

                canvas.width =
                  sourceImage.naturalWidth *
                  scale;

                canvas.height =
                  sourceImage.naturalHeight *
                  scale;

                const ctx =
                  canvas.getContext(
                    "2d",
                    {
                      willReadFrequently:
                        true,
                    }
                  );

                if (!ctx) {
                  reject(
                    new Error(
                      "Unable to create OCR canvas."
                    )
                  );

                  return;
                }

                ctx.imageSmoothingEnabled =
                  true;

                ctx.imageSmoothingQuality =
                  "high";

                ctx.drawImage(
                  sourceImage,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                if (
                  mode ===
                    "contrast" ||
                  mode ===
                    "grayscale"
                ) {
                  const imageData =
                    ctx.getImageData(
                      0,
                      0,
                      canvas.width,
                      canvas.height
                    );

                  const data =
                    imageData.data;

                  for (
                    let i = 0;
                    i < data.length;
                    i += 4
                  ) {
                    let r =
                      data[i];

                    let g =
                      data[i + 1];

                    let b =
                      data[i + 2];

                    if (
                      mode ===
                      "grayscale"
                    ) {
                      const gray =
                        0.299 * r +
                        0.587 * g +
                        0.114 * b;

                      r = gray;
                      g = gray;
                      b = gray;
                    }

                    const contrast =
                      1.35;

                    r =
                      (r - 128) *
                        contrast +
                      128;

                    g =
                      (g - 128) *
                        contrast +
                      128;

                    b =
                      (b - 128) *
                        contrast +
                      128;

                    data[i] =
                      clamp(
                        r,
                        0,
                        255
                      );

                    data[i + 1] =
                      clamp(
                        g,
                        0,
                        255
                      );

                    data[i + 2] =
                      clamp(
                        b,
                        0,
                        255
                      );
                  }

                  ctx.putImageData(
                    imageData,
                    0,
                    0
                  );
                }

                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(
                        new Error(
                          "Unable to create OCR image."
                        )
                      );

                      return;
                    }

                    resolve({
                      blob,
                      scale,
                    });
                  },
                  "image/png"
                );
              };

            sourceImage.onerror =
              () => {
                URL.revokeObjectURL(
                  url
                );

                reject(
                  new Error(
                    "Unable to prepare image for OCR."
                  )
                );
              };

            sourceImage.src = url;
          }
        );
      }


      async function recognizeOCR(
        source,
        scale
      ) {
        const result =
          await worker.recognize(
            source,
            {},
            {
              blocks: true,
            }
          );

        const blocks =
          result?.data?.blocks ||
          [];

        const words =
          blocks
            .flatMap(
              (block) =>
                block.paragraphs ||
                []
            )
            .flatMap(
              (paragraph) =>
                paragraph.lines ||
                []
            )
            .flatMap(
              (line) =>
                line.words ||
                []
            )
            .filter(
              (word) =>
                word.text &&
                word.text.trim()
            )
            .map(
              (word, index) => ({
                id: index,

                text:
                  normalizeOCRText(
                    word.text
                  ),

                x:
                  word.bbox.x0 /
                  scale,

                y:
                  word.bbox.y0 /
                  scale,

                width:
                  (word.bbox.x1 -
                    word.bbox.x0) /
                  scale,

                height:
                  (word.bbox.y1 -
                    word.bbox.y0) /
                  scale,

                confidence:
                  Number(
                    word.confidence ||
                      0
                  ),
              })
            )
            .filter(
              (word) =>
                !isLikelyOCRNoise(
                  word.text
                )
            );

        return {
          text:
            result?.data?.text ||
            "",
          words,
        };
      }


      /*
       * =====================================================
       * TARGETED DARK TEXT REGION DETECTOR
       * =====================================================
       *
       * This does NOT assume a fixed location for London.
       * It finds compact dark connected components and merges
       * nearby components into text lines.
       *
       * The detector works in ORIGINAL IMAGE coordinates.
       */

      async function detectDarkTextRegions(
        sourceFile
      ) {
        return new Promise(
          (resolve, reject) => {
            const url =
              URL.createObjectURL(
                sourceFile
              );

            const image =
              new Image();

            image.onload =
              () => {
                URL.revokeObjectURL(
                  url
                );

                const width =
                  image.naturalWidth;

                const height =
                  image.naturalHeight;

                if (
                  !width ||
                  !height
                ) {
                  resolve([]);

                  return;
                }

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                /*
                 * Use 2x only for detection
                 * to preserve small letter components.
                 */
                const scale = 2;

                canvas.width =
                  width * scale;

                canvas.height =
                  height * scale;

                const ctx =
                  canvas.getContext(
                    "2d",
                    {
                      willReadFrequently:
                        true,
                    }
                  );

                if (!ctx) {
                  reject(
                    new Error(
                      "Unable to create dark-text detection canvas."
                    )
                  );

                  return;
                }

                ctx.drawImage(
                  image,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                const imageData =
                  ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                  );

                const data =
                  imageData.data;

                /*
                 * We use a small binary mask.
                 *
                 * Dark text:
                 *   low brightness
                 *
                 * But we avoid extremely dark artwork
                 * by requiring the component to be
                 * compact and text-like later.
                 */
                const maskWidth =
                  canvas.width;

                const maskHeight =
                  canvas.height;

                const mask =
                  new Uint8Array(
                    maskWidth *
                      maskHeight
                  );

                for (
                  let y = 0;
                  y < maskHeight;
                  y++
                ) {
                  for (
                    let x = 0;
                    x < maskWidth;
                    x++
                  ) {
                    const index =
                      (
                        y *
                          maskWidth +
                        x
                      ) *
                      4;

                    const r =
                      data[index];

                    const g =
                      data[index + 1];

                    const b =
                      data[index + 2];

                    const maxChannel =
                      Math.max(
                        r,
                        g,
                        b
                      );

                    const minChannel =
                      Math.min(
                        r,
                        g,
                        b
                      );

                    const brightness =
                      0.299 * r +
                      0.587 * g +
                      0.114 * b;

                    /*
                     * London is black on red:
                     * low brightness AND low saturation
                     * is not required, because black
                     * has low channel values.
                     */
                    const isDark =
                      brightness <
                        105 &&
                      maxChannel <
                        145;

                    /*
                     * Ignore the far-right artwork
                     * as a first-pass heuristic.
                     * This is intentionally generous;
                     * connected-component filtering below
                     * does the real work.
                     */
                    if (isDark) {
                      mask[
                        y *
                          maskWidth +
                        x
                      ] = 1;
                    }
                  }
                }

                /*
                 * Connected components.
                 *
                 * We intentionally use 8-neighbour
                 * connectivity so anti-aliased letters
                 * stay together.
                 */
                const visited =
                  new Uint8Array(
                    mask.length
                  );

                const components =
                  [];

                const queueX =
                  [];

                const queueY =
                  [];

                for (
                  let y = 0;
                  y < maskHeight;
                  y++
                ) {
                  for (
                    let x = 0;
                    x < maskWidth;
                    x++
                  ) {
                    const startIndex =
                      y *
                        maskWidth +
                      x;

                    if (
                      !mask[
                        startIndex
                      ] ||
                      visited[
                        startIndex
                      ]
                    ) {
                      continue;
                    }

                    queueX.length =
                      0;

                    queueY.length =
                      0;

                    queueX.push(x);
                    queueY.push(y);

                    visited[
                      startIndex
                    ] = 1;

                    let minX = x;
                    let minY = y;
                    let maxX = x;
                    let maxY = y;
                    let area = 0;

                    for (
                      let q = 0;
                      q <
                      queueX.length;
                      q++
                    ) {
                      const currentX =
                        queueX[q];

                      const currentY =
                        queueY[q];

                      area++;

                      minX =
                        Math.min(
                          minX,
                          currentX
                        );

                      minY =
                        Math.min(
                          minY,
                          currentY
                        );

                      maxX =
                        Math.max(
                          maxX,
                          currentX
                        );

                      maxY =
                        Math.max(
                          maxY,
                          currentY
                        );

                      for (
                        let dy = -1;
                        dy <= 1;
                        dy++
                      ) {
                        for (
                          let dx = -1;
                          dx <= 1;
                          dx++
                        ) {
                          if (
                            dx === 0 &&
                            dy === 0
                          ) {
                            continue;
                          }

                          const nx =
                            currentX +
                            dx;

                          const ny =
                            currentY +
                            dy;

                          if (
                            nx < 0 ||
                            ny < 0 ||
                            nx >=
                              maskWidth ||
                            ny >=
                              maskHeight
                          ) {
                            continue;
                          }

                          const nextIndex =
                            ny *
                              maskWidth +
                            nx;

                          if (
                            mask[
                              nextIndex
                            ] &&
                            !visited[
                              nextIndex
                            ]
                          ) {
                            visited[
                              nextIndex
                            ] = 1;

                            queueX.push(
                              nx
                            );

                            queueY.push(
                              ny
                            );
                          }
                        }
                      }
                    }

                    const componentWidth =
                      maxX -
                      minX +
                      1;

                    const componentHeight =
                      maxY -
                      minY +
                      1;

                    /*
                     * Convert to original image
                     * coordinates.
                     */
                    const box = {
                      x:
                        minX / scale,
                      y:
                        minY / scale,
                      width:
                        componentWidth /
                        scale,
                      height:
                        componentHeight /
                        scale,
                      area,
                    };

                    /*
                     * Reject:
                     * - tiny noise
                     * - huge artwork
                     * - extremely tall lines
                     * - very large blocks
                     */
                    if (
                      box.width <
                        1.5 ||
                      box.height <
                        1.5
                    ) {
                      continue;
                    }

                    if (
                      box.width >
                        width * 0.35 ||
                      box.height >
                        height * 0.25
                    ) {
                      continue;
                    }

                    const fillRatio =
                      area /
                      (
                        componentWidth *
                        componentHeight
                      );

                    /*
                     * Letters normally occupy only part
                     * of their bounding box. Solid artwork
                     * tends to have a much higher fill ratio.
                     */
                    if (
                      fillRatio >
                        0.9
                    ) {
                      continue;
                    }

                    /*
                     * Keep components that look roughly
                     * character-like.
                     */
                    const aspect =
                      box.width /
                      Math.max(
                        box.height,
                        1
                      );

                    if (
                      aspect >
                        20 ||
                      aspect <
                        0.08
                    ) {
                      continue;
                    }

                    components.push(
                      box
                    );
                  }
                }

                /*
                 * Merge nearby character components.
                 *
                 * First sort left-to-right, then group
                 * components with similar baselines.
                 */
                components.sort(
                  (a, b) => {
                    if (
                      Math.abs(
                        a.y - b.y
                      ) < 8
                    ) {
                      return (
                        a.x - b.x
                      );
                    }

                    return (
                      a.y - b.y
                    );
                  }
                );

                const lines =
                  [];

                for (
                  const component of
                    components
                ) {
                  const centerY =
                    component.y +
                    component.height /
                      2;

                  let bestLine =
                    null;

                  let bestScore =
                    Infinity;

                  for (
                    const line of
                      lines
                  ) {
                    const lineCenterY =
                      line.y +
                      line.height /
                        2;

                    const verticalDistance =
                      Math.abs(
                        centerY -
                          lineCenterY
                      );

                    const maxHeight =
                      Math.max(
                        line.height,
                        component.height
                      );

                    /*
                     * Similar baseline and
                     * similar text height.
                     */
                    if (
                      verticalDistance >
                      maxHeight *
                        0.65
                    ) {
                      continue;
                    }

                    const gap =
                      component.x -
                      (
                        line.x +
                        line.width
                      );

                    /*
                     * Allow character/word spacing,
                     * but don't join distant artwork.
                     */
                    const maxGap =
                      Math.max(
                        14,
                        maxHeight *
                          1.25
                      );

                    if (
                      gap >
                      maxGap
                    ) {
                      continue;
                    }

                    const heightRatio =
                      component.height /
                      Math.max(
                        line.height,
                        1
                      );

                    if (
                      heightRatio <
                        0.45 ||
                      heightRatio >
                        2.1
                    ) {
                      continue;
                    }

                    const score =
                      verticalDistance +
                      Math.max(
                        gap,
                        0
                      );

                    if (
                      score <
                      bestScore
                    ) {
                      bestScore =
                        score;

                      bestLine =
                        line;
                    }
                  }

                  if (
                    !bestLine
                  ) {
                    lines.push({
                      x:
                        component.x,
                      y:
                        component.y,
                      width:
                        component.width,
                      height:
                        component.height,
                      components: [
                        component,
                      ],
                    });
                  } else {
                    const right =
                      Math.max(
                        bestLine.x +
                          bestLine.width,
                        component.x +
                          component.width
                      );

                    const bottom =
                      Math.max(
                        bestLine.y +
                          bestLine.height,
                        component.y +
                          component.height
                      );

                    bestLine.x =
                      Math.min(
                        bestLine.x,
                        component.x
                      );

                    bestLine.y =
                      Math.min(
                        bestLine.y,
                        component.y
                      );

                    bestLine.width =
                      right -
                      bestLine.x;

                    bestLine.height =
                      bottom -
                      bestLine.y;

                    bestLine.components.push(
                      component
                    );
                  }
                }

                /*
                 * Tighten and validate each line.
                 */
                const regions =
                  lines
                    .map(
                      (line) => {
                        const paddingX =
                          Math.max(
                            2,
                            Math.min(
                              8,
                              line.height *
                                0.2
                            )
                          );

                        const paddingY =
                          Math.max(
                            2,
                            Math.min(
                              6,
                              line.height *
                                0.18
                            )
                          );

                        return {
                          x:
                            Math.max(
                              0,
                              line.x -
                                paddingX
                            ),
                          y:
                            Math.max(
                              0,
                              line.y -
                                paddingY
                            ),
                          width:
                            Math.min(
                              width -
                                line.x +
                                paddingX,
                              line.width +
                                paddingX *
                                  2
                            ),
                          height:
                            Math.min(
                              height -
                                line.y +
                                paddingY,
                              line.height +
                                paddingY *
                                  2
                            ),
                          componentCount:
                            line.components
                              .length,
                        };
                      }
                    )
                    .filter(
                      (region) => {
                        /*
                         * A useful text region should not
                         * be enormous compared with the
                         * banner.
                         */
                        if (
                          region.width >
                            width * 0.75
                        ) {
                          return false;
                        }

                        if (
                          region.height >
                            height * 0.2
                        ) {
                          return false;
                        }

                        /*
                         * Avoid tiny isolated noise.
                         */
                        if (
                          region.width <
                            4 ||
                          region.height <
                            3
                        ) {
                          return false;
                        }

                        return true;
                      }
                    );

                console.log(
                  "TIGHT DARK TEXT REGIONS:",
                  regions
                );

                resolve(
                  regions
                );
              };

            image.onerror =
              () => {
                URL.revokeObjectURL(
                  url
                );

                reject(
                  new Error(
                    "Unable to load image for dark text detection."
                  )
                );
              };

            image.src = url;
          }
        );
      }


      async function recognizeDarkRegion(
        sourceFile,
        region
      ) {
        return new Promise(
          (resolve, reject) => {
            const url =
              URL.createObjectURL(
                sourceFile
              );

            const image =
              new Image();

            image.onload =
              async () => {
                URL.revokeObjectURL(
                  url
                );

                const padding = 8;

                const sx =
                  Math.max(
                    0,
                    Math.floor(
                      region.x -
                        padding
                    )
                  );

                const sy =
                  Math.max(
                    0,
                    Math.floor(
                      region.y -
                        padding
                    )
                  );

                const sw =
                  Math.min(
                    image.naturalWidth -
                      sx,
                    Math.ceil(
                      region.width +
                        padding * 2
                    )
                  );

                const sh =
                  Math.min(
                    image.naturalHeight -
                      sy,
                    Math.ceil(
                      region.height +
                        padding * 2
                    )
                  );

                /*
                 * Reject suspiciously large crops.
                 * A dark-text crop should be tight.
                 */
                if (
                  sw <= 0 ||
                  sh <= 0 ||
                  sw >
                    image.naturalWidth *
                      0.6 ||
                  sh >
                    image.naturalHeight *
                      0.3
                ) {
                  resolve([]);

                  return;
                }

                const scale = 3;

                const canvas =
                  document.createElement(
                    "canvas"
                  );

                canvas.width =
                  sw * scale;

                canvas.height =
                  sh * scale;

                const ctx =
                  canvas.getContext(
                    "2d"
                  );

                if (!ctx) {
                  reject(
                    new Error(
                      "Unable to create dark-region OCR canvas."
                    )
                  );

                  return;
                }

                ctx.imageSmoothingEnabled =
                  true;

                ctx.imageSmoothingQuality =
                  "high";

                ctx.drawImage(
                  image,
                  sx,
                  sy,
                  sw,
                  sh,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

                canvas.toBlob(
                  async (blob) => {
                    if (!blob) {
                      resolve([]);

                      return;
                    }

                    try {
                      const ocr =
                        await recognizeOCR(
                          blob,
                          scale
                        );

                      const words =
                        ocr.words.map(
                          (word) => ({
                            ...word,
                            x:
                              word.x +
                              sx,
                            y:
                              word.y +
                              sy,
                          })
                        );

                      resolve(
                        words
                      );
                    } catch (
                      error
                    ) {
                      console.warn(
                        "Dark region OCR failed:",
                        error
                      );

                      resolve(
                        []
                      );
                    }
                  },
                  "image/png"
                );
              };

            image.onerror =
              () => {
                URL.revokeObjectURL(
                  url
                );

                reject(
                  new Error(
                    "Unable to load dark-region image."
                  )
                );
              };

            image.src = url;
          }
        );
      }


      const allOCRWords = [];

      /*
       * PASS 1 — original.
       */
      try {
        const originalOCR =
          await recognizeOCR(
            file,
            1
          );

        console.log(
          "OCR PASS 1 - ORIGINAL:",
          originalOCR.words
        );

        allOCRWords.push(
          ...originalOCR.words
        );
      } catch (
        ocrError
      ) {
        console.warn(
          "Original OCR failed:",
          ocrError
        );
      }


      /*
       * PASS 2 — upscaled.
       */
      try {
        const upscaled =
          await createOCRVariant(
            file,
            "upscaled"
          );

        const upscaledOCR =
          await recognizeOCR(
            upscaled.blob,
            upscaled.scale
          );

        console.log(
          "OCR PASS 2 - UPSCALED:",
          upscaledOCR.words
        );

        allOCRWords.push(
          ...upscaledOCR.words
        );
      } catch (
        ocrError
      ) {
        console.warn(
          "Upscaled OCR failed:",
          ocrError
        );
      }


      /*
       * PASS 3 — contrast.
       */
      try {
        const contrast =
          await createOCRVariant(
            file,
            "contrast"
          );

        const contrastOCR =
          await recognizeOCR(
            contrast.blob,
            contrast.scale
          );

        console.log(
          "OCR PASS 3 - CONTRAST:",
          contrastOCR.words
        );

        allOCRWords.push(
          ...contrastOCR.words
        );
      } catch (
        ocrError
      ) {
        console.warn(
          "Contrast OCR failed:",
          ocrError
        );
      }


      /*
       * PASS 4 — grayscale.
       */
      try {
        const grayscale =
          await createOCRVariant(
            file,
            "grayscale"
          );

        const grayscaleOCR =
          await recognizeOCR(
            grayscale.blob,
            grayscale.scale
          );

        console.log(
          "OCR PASS 4 - GRAYSCALE:",
          grayscaleOCR.words
        );

        allOCRWords.push(
          ...grayscaleOCR.words
        );
      } catch (
        ocrError
      ) {
        console.warn(
          "Grayscale OCR failed:",
          ocrError
        );
      }


      /*
       * PASS 5 — targeted dark text.
       *
       * This is the important new pass.
       */
      try {
        const darkRegions =
          await detectDarkTextRegions(
            file
          );

        console.log(
          "TIGHT DARK TEXT REGIONS:",
          darkRegions
        );

        for (
          let i = 0;
          i <
          darkRegions.length;
          i++
        ) {
          const region =
            darkRegions[i];

          const words =
            await recognizeDarkRegion(
              file,
              region
            );

          console.log(
            `DARK REGION OCR ${i + 1}:`,
            {
              region,
              words,
            }
          );

          allOCRWords.push(
            ...words
          );
        }
      } catch (
        darkOCRerror
      ) {
        console.warn(
          "Dark text detection failed:",
          darkOCRerror
        );
      }


      /*
       * =====================================================
       * MERGE RESULTS
       * =====================================================
       */
      const mergedWords = [];

      allOCRWords.forEach(
        (candidate) => {
          const normalizedText =
            normalizeOCRText(
              candidate.text
            ).toLowerCase();

          if (
            !normalizedText ||
            isLikelyOCRNoise(
              candidate.text
            )
          ) {
            return;
          }

          const existing =
            mergedWords.find(
              (word) => {
                const sameText =
                  normalizeOCRText(
                    word.text
                  ).toLowerCase() ===
                  normalizedText;

                if (!sameText) {
                  return false;
                }

                const centerAX =
                  word.x +
                  word.width / 2;

                const centerAY =
                  word.y +
                  word.height / 2;

                const centerBX =
                  candidate.x +
                  candidate.width /
                    2;

                const centerBY =
                  candidate.y +
                  candidate.height /
                    2;

                const distance =
                  Math.sqrt(
                    Math.pow(
                      centerAX -
                        centerBX,
                      2
                    ) +
                    Math.pow(
                      centerAY -
                        centerBY,
                      2
                    )
                  );

                const tolerance =
                  Math.max(
                    12,
                    Math.max(
                      word.height,
                      candidate.height
                    ) * 0.75
                  );

                return (
                  distance <=
                  tolerance
                );
              }
            );

          if (!existing) {
            mergedWords.push({
              ...candidate,
              id:
                mergedWords.length,
            });

            return;
          }

          if (
            candidate.confidence >
            existing.confidence
          ) {
            Object.assign(
              existing,
              candidate
            );
          }
        }
      );


      /*
       * Remove duplicate/overlapping boxes caused
       * by multiple OCR passes.
       */
      const finalWords =
        mergedWords
          .filter(
            (word) =>
              word.width >= 2 &&
              word.height >= 2
          )
          .sort(
            (a, b) => {
              if (
                Math.abs(
                  a.y - b.y
                ) <=
                Math.max(
                  a.height,
                  b.height
                ) *
                  0.5
              ) {
                return (
                  a.x - b.x
                );
              }

              return (
                a.y - b.y
              );
            }
          )
          .map(
            (word, index) => ({
              ...word,
              id: index,
            })
          );


      console.log(
        "MERGED OCR WORDS:",
        finalWords
      );

      console.table(
        finalWords.map(
          (word) => ({
            text:
              word.text,
            confidence:
              Math.round(
                word.confidence
              ),
            x:
              Math.round(
                word.x
              ),
            y:
              Math.round(
                word.y
              ),
            width:
              Math.round(
                word.width
              ),
            height:
              Math.round(
                word.height
              ),
          })
        )
      );


      /*
       * Existing grouping remains the final
       * text-region step.
       */
      const groupedLines =
        groupWordsIntoLines(
          finalWords
        );

      console.log(
        "GROUPED TEXT LINES:",
        groupedLines
      );

      const regions =
        groupedLines.map(
          (region) => ({
            ...region,

            originalText:
              region.text,

            edited: false,
          })
        );

      console.log(
        "FINAL TEXT REGIONS:",
        regions
      );

      setTextRegions(
        regions
      );

      await worker.terminate();

    } catch (err) {
      console.error(
        "OCR ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to detect text in this image."
      );

    } finally {
      setLoading(false);
    }
  }


  /* =====================================================
     FILE HANDLERS
     ===================================================== */

  function handleFile(event) {
    const file =
      event.target.files?.[0];

    if (file) {
      processImage(file);
    }

    /*
     * Allow the same image to be selected again.
     */
    event.target.value = "";
  }


  function handleDrop(event) {
    event.preventDefault();

    const file =
      event.dataTransfer.files?.[0];

    processImage(file);
  }


  function openFilePicker() {
    inputRef.current?.click();
  }


  /* =====================================================
     APPLY TEXT
     ===================================================== */

  function applyText() {
    if (
      selectedRegionId === null
    ) {
      return;
    }


    setTextRegions(
      (regions) =>
        regions.map(
          (region) => {
            if (
              region.id !==
              selectedRegionId
            ) {
              return region;
            }


            return {
              ...region,

              text:
                editedText,

              edited: true,
            };
          }
        )
    );
  }


  /* =====================================================
     DOWNLOAD PNG
     ===================================================== */

  async function downloadImage() {
    const canvas = canvasRef.current;

    if (!canvas || !image) {
      return;
    }

    try {
      /*
       * Wait until the latest edited state has been rendered.
       * This prevents downloading the previous canvas state.
       */
      const rendered = await drawEditedImage();

      if (!rendered) {
        setError("Unable to prepare the edited image.");
        return;
      }

      const downloadName =
        fileName
          ? fileName.replace(
              /\.(png|jpg|jpeg)$/i,
              ""
            ) + "-edited.png"
          : "edited-image.png";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Unable to create the PNG file.");
            return;
          }

          const url =
            URL.createObjectURL(blob);

          const link =
            document.createElement("a");

          link.href = url;
          link.download = downloadName;

          document.body.appendChild(link);
          link.click();
          link.remove();

          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        },
        "image/png"
      );
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
      setError("Unable to download the edited image.");
    }
  }

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <section className="image-editor-page">

      {/* HEADER */}

      <div className="image-editor-header">

        <div>

          <p className="eyebrow">
            IMAGE EDITOR
          </p>

          <h2>
            Edit text inside an image.
          </h2>

          <p>
            Upload a PNG or JPG and
            we'll detect the text.
          </p>

        </div>

      </div>


      {/* ERROR */}

      {error && (
        <div className="image-editor-error">
          {error}
        </div>
      )}


      {/* UPLOAD */}

      {!image && (

        <div
          className="image-upload-zone"

          onDragOver={(event) =>
            event.preventDefault()
          }

          onDrop={handleDrop}

          onClick={
            openFilePicker
          }
        >

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleFile}
          />

          <div className="upload-plus">
            +
          </div>

          <h3>
            Drop image here
          </h3>

          <p>
            PNG or JPG
          </p>

          <button
            type="button"
            className="image-upload-button"

            onClick={(event) => {
              event.stopPropagation();

              openFilePicker();
            }}
          >
            Choose image
          </button>

        </div>
      )}


      {/* PROCESSING */}

      {image && loading && (

        <div className="image-processing">

          <div className="processing-title">
            Analyzing image...
          </div>

          <div className="processing-bar">

            <div
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

          <div className="processing-percentage">
            {progress}%
          </div>

        </div>
      )}


      {/* EDITOR */}

      {image && !loading && (

        <div className="image-editor-workspace">


          {/* IMAGE */}

          <div className="image-editor-preview">

            <div className="image-toolbar">

              <div>

                <strong>
                  {fileName}
                </strong>

                <span>
                  {imageSize.width}
                  {" × "}
                  {imageSize.height}
                </span>

              </div>


              <div className="image-toolbar-actions">

                <button
                  className="image-change-button"
                  onClick={
                    openFilePicker
                  }
                >
                  Change image
                </button>


                <button
                  className="download-image-button"
                  onClick={
                    downloadImage
                  }
                >
                  Download PNG
                </button>

              </div>


              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={handleFile}
              />

            </div>


            <div className="image-editor-canvas">

              <div className="image-stage">

                {/* REAL EDITED IMAGE */}

                <canvas
                  ref={canvasRef}
                  className="image-main"
                  aria-label={`Editable preview of ${fileName}`}
                />


                {/* OCR SELECTION BOXES */}

                {textRegions.map(
                  (region) => (

                    <div
                      key={region.id}

                      className={
                        selectedRegionId ===
                        region.id
                          ? "ocr-box selected"
                          : "ocr-box"
                      }

                      onClick={(event) => {
                        event.stopPropagation();

                        selectRegion(
                          region
                        );
                      }}

                      style={{
                        left:
                          `${(region.x / imageSize.width) * 100}%`,

                        top:
                          `${(region.y / imageSize.height) * 100}%`,

                        width:
                          `${(region.width / imageSize.width) * 100}%`,

                        height:
                          `${(region.height / imageSize.height) * 100}%`,
                      }}
                    >

                      <span>
                        {region.text}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>


          {/* SIDEBAR */}

          <aside className="image-sidebar">

            <div className="image-sidebar-header">

              <div>

                <span>
                  DETECTED TEXT
                </span>

                <strong>
                  {textRegions.length}
                </strong>

              </div>

            </div>


            {/* EDIT PANEL */}

            {selectedRegionId !== null && (

              <div className="text-edit-panel">

                <div className="text-edit-label">
                  EDIT SELECTED TEXT
                </div>


                <div className="text-edit-original">

                  <span>
                    ORIGINAL
                  </span>

                  <p>
                    {
                      textRegions.find(
                        (region) =>
                          region.id ===
                          selectedRegionId
                      )?.originalText
                    }
                  </p>

                </div>


                <div className="text-edit-input">

                  <label>
                    REPLACE WITH
                  </label>

                  <textarea
                    value={
                      editedText
                    }

                    onChange={(
                      event
                    ) =>
                      setEditedText(
                        event.target.value
                      )
                    }

                    autoFocus
                  />

                </div>


                <button
                  type="button"
                  className="apply-text-button"

                  onClick={
                    applyText
                  }
                >
                  Apply Text
                </button>

              </div>
            )}


            {/* TEXT LIST */}

            <div className="detected-text-list">

              {textRegions.length === 0 && (

                <div className="no-text">
                  No text detected.
                </div>

              )}


              {textRegions.map(
                (region, index) => (

                  <div
                    className={
                      selectedRegionId ===
                      region.id
                        ? "detected-text-item selected"
                        : "detected-text-item"
                    }

                    key={region.id}

                    onClick={() =>
                      selectRegion(
                        region
                      )
                    }
                  >

                    <label>

                      <span>
                        Text {index + 1}
                      </span>

                      <span>
                        {Math.round(
                          region.confidence
                        )}%
                      </span>

                    </label>


                    <textarea
                      value={
                        region.text
                      }

                      onClick={(event) => {
                        event.stopPropagation();
                      }}

                      onChange={(event) => {

                        const updated =
                          [
                            ...textRegions,
                          ];


                        updated[index] = {
                          ...updated[index],

                          text:
                            event.target.value,

                          edited:
                            true,
                        };


                        setTextRegions(
                          updated
                        );


                        if (
                          region.id ===
                          selectedRegionId
                        ) {
                          setEditedText(
                            event.target.value
                          );
                        }

                      }}
                    />


                    <div className="ocr-position">

                      x:
                      {" "}
                      {Math.round(
                        region.x
                      )}

                      {" · "}

                      y:
                      {" "}
                      {Math.round(
                        region.y
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          </aside>

        </div>
      )}

    </section>
  );
}