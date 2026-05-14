import Image from "next/image";
import { Icon } from "@iconify/react";

const PrevNextButton = ({ type, show, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 bg-indigo-500 hover:bg-indigo-600 border border-indigo-300 shadow-md flex items-center justify-center transition-all duration-200 ${
        type === "prev" ? "left-3" : "right-3"
      }`}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: show ? "flex" : "none",
      }}
    >
      {type === "prev" ? (
        <Icon icon="mingcute:left-fill" width={30} className="text-white" />
      ) : (
        <Icon icon="mingcute:right-fill" width={30} className="text-white" />
      )}
    </button>
  );
};

export default function ImageCarousel({ images, activeImageIndex, setActiveImageIndex }) {
  const handlePrevClick = () => {
    if (activeImageIndex > 0) setActiveImageIndex(activeImageIndex - 1);
  };

  const handleNextClick = () => {
    if (activeImageIndex < images.length - 1) setActiveImageIndex(activeImageIndex + 1);
  };

  return (
    <div className="relative w-full mx-auto">
      {/* Fixed-height container — image fills without cropping */}
      <div className="relative w-full h-[420px] bg-gray-100 overflow-hidden rounded-xl">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="relative w-full h-full flex-shrink-0 flex items-center justify-center"
            >
              <Image
                src={"https://wsrv.nl?url=" + image + "&w=900&h=900"}
                alt={`Image ${index + 1}`}
                fill
                className="object-contain"   // ← never crops or distorts
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </div>
          ))}
        </div>
      </div>

      <PrevNextButton type="prev" show={activeImageIndex > 0} onClick={handlePrevClick} />
      <PrevNextButton type="next" show={activeImageIndex < images.length - 1} onClick={handleNextClick} />
    </div>
  );
}