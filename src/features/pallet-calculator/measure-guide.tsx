export function MeasureGuide({ draftBag }: { draftBag: boolean }) {
  return (
    <div className="measurement-guide">
      {" "}
      <svg
        viewBox="0 0 270 130"
        role="img"
        aria-label="Length and width along the base; height or thickness vertically"
      >
        <path
          d="M45 60 125 30 190 55 110 90Z"
          fill="#d9e8e0"
          stroke="#709d8b"
        />
        <path d="M45 60V90L110 120V90Z" fill="#c8ded7" stroke="#709d8b" />
        <path d="M110 90 190 55V85L110 120Z" fill="#accbbd" stroke="#709d8b" />
        <text x="50" y="40">
          Length
        </text>
        <text x="152" y="27">
          Width
        </text>
        <text x="192" y="105">
          {draftBag ? "Thickness" : "Height"}
        </text>
      </svg>
      <p>
        {draftBag
          ? "Measure a filled bag lying flat. Height means how thick the filled bag is."
          : "Measure the outside of one closed box. Length and width are the bottom; height goes up."}
      </p>
    </div>
  );
}
