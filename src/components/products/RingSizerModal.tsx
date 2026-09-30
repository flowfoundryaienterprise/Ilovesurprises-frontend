import React, { useState, useMemo } from 'react';
import {
  Ruler,
  Check,
  X,
  CreditCard,
  Sparkles,
  Info,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface RingSizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSize: number;
  onSelectSize: (size: number) => void;
}

interface RingSizeData {
  usSize: number;
  diameterMm: number; // Inside diameter in millimeters
  circumferenceMm: number; // Inside circumference in millimeters
  ukSize: string;
  euSize: string;
}

export const RING_SIZE_SPECS: RingSizeData[] = [
  { usSize: 5, diameterMm: 15.7, circumferenceMm: 49.3, ukSize: 'J 1/2', euSize: '49' },
  { usSize: 6, diameterMm: 16.5, circumferenceMm: 51.9, ukSize: 'M', euSize: '52' },
  { usSize: 7, diameterMm: 17.3, circumferenceMm: 54.4, ukSize: 'O', euSize: '54' },
  { usSize: 8, diameterMm: 18.2, circumferenceMm: 57.0, ukSize: 'Q', euSize: '57' },
  { usSize: 9, diameterMm: 19.0, circumferenceMm: 59.5, ukSize: 'S', euSize: '60' },
  { usSize: 10, diameterMm: 19.8, circumferenceMm: 62.1, ukSize: 'T 1/2', euSize: '62' },
];

export const RingSizerModal: React.FC<RingSizerModalProps> = ({
  isOpen,
  onClose,
  currentSize,
  onSelectSize,
}) => {
  const [activeTab, setActiveTab] = useState<'ring' | 'finger' | 'chart'>('ring');
  const [selectedSize, setSelectedSize] = useState<number>(() => currentSize || 7);

  // Circle sizer state (diameter in millimeters)
  const [interactiveDiameterMm, setInteractiveDiameterMm] = useState<number>(() => {
    const matched = RING_SIZE_SPECS.find((s) => s.usSize === currentSize);
    return matched ? matched.diameterMm : 17.3;
  });

  // Finger circumference state (in millimeters)
  const [fingerCircumferenceMm, setFingerCircumferenceMm] = useState<number>(54.4);

  // Calibration scale factor (pixels per millimeter).
  // Standard CSS pixel density is ~96 DPI -> ~3.78 px/mm.
  // Standard credit card width = 85.6 mm.
  const [pixelsPerMm, setPixelsPerMm] = useState<number>(3.8);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [cardWidthPx, setCardWidthPx] = useState<number>(85.6 * 3.8);

  // Find nearest US size from diameter
  const nearestSizeFromDiameter = useMemo(() => {
    let closest = RING_SIZE_SPECS[0];
    let minDiff = Math.abs(RING_SIZE_SPECS[0].diameterMm - interactiveDiameterMm);
    for (const spec of RING_SIZE_SPECS) {
      const diff = Math.abs(spec.diameterMm - interactiveDiameterMm);
      if (diff < minDiff) {
        minDiff = diff;
        closest = spec;
      }
    }
    return closest;
  }, [interactiveDiameterMm]);

  // Find nearest US size from circumference
  const nearestSizeFromCircumference = useMemo(() => {
    let closest = RING_SIZE_SPECS[0];
    let minDiff = Math.abs(RING_SIZE_SPECS[0].circumferenceMm - fingerCircumferenceMm);
    for (const spec of RING_SIZE_SPECS) {
      const diff = Math.abs(spec.circumferenceMm - fingerCircumferenceMm);
      if (diff < minDiff) {
        minDiff = diff;
        closest = spec;
      }
    }
    return closest;
  }, [fingerCircumferenceMm]);

  if (!isOpen) return null;

  const handleApplySize = (sizeToApply: number) => {
    onSelectSize(sizeToApply);
    onClose();
  };

  const handleCardSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPx = parseFloat(e.target.value);
    setCardWidthPx(newPx);
    // Standard credit card width = 85.6mm
    setPixelsPerMm(newPx / 85.6);
  };

  const circlePixelSize = interactiveDiameterMm * pixelsPerMm;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ring-sizer-title"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#eedbe6] text-[#141219] flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#eedbe6] relative bg-[#fdfafc]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#fff0f3] border border-[#fecdd3] text-[#D30915] flex items-center justify-center shadow-2xs">
              <Ruler className="w-4 h-4" />
            </div>
            <h2 id="ring-sizer-title" className="text-lg sm:text-xl font-black text-[#141219] font-display">
              Interactive Ring Sizing Tool
            </h2>
          </div>
          <p className="text-xs text-[#716d77] m-0">
            Find your exact US ring size for your candle jewelry reveal (Sizes 5 to 10).
          </p>

          {/* Interactive Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 p-1 bg-[#f4ebf1] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('ring')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'ring'
                  ? 'bg-white text-[#D30915] shadow-xs font-black'
                  : 'text-[#716d77] hover:text-[#141219]'
              }`}
            >
              1. Place a Ring
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finger')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'finger'
                  ? 'bg-white text-[#D30915] shadow-xs font-black'
                  : 'text-[#716d77] hover:text-[#141219]'
              }`}
            >
              2. Measure Finger
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-white text-[#D30915] shadow-xs font-black'
                  : 'text-[#716d77] hover:text-[#141219]'
              }`}
            >
              3. Size Chart
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ================================================================
              TAB 1: PLACE A RING ON SCREEN
          ================================================================ */}
          {activeTab === 'ring' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#fff0f3] rounded-2xl border border-[#fecdd3] text-xs text-[#716d77] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#D30915] shrink-0 mt-0.5" />
                <p className="m-0 leading-relaxed">
                  <strong>Instructions:</strong> Place an existing ring that fits your desired finger flat on the circle below.
                  Adjust the slider until the pink circle touches the inside edge of your ring.
                </p>
              </div>

              {/* Calibration Toggle */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsCalibrating(!isCalibrating)}
                  className="text-xs font-bold text-[#D30915] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{isCalibrating ? 'Hide Screen Calibration' : 'Calibrate Screen with Card'}</span>
                </button>
              </div>

              {/* Optional Calibration Card Box */}
              {isCalibrating && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>Screen Scale Calibration</span>
                    <span className="text-[11px] font-mono">{pixelsPerMm.toFixed(2)} px/mm</span>
                  </div>
                  <p className="text-[11px] text-amber-800 m-0">
                    Place any standard credit card, debit card, or ID against the box below. Adjust the slider until the box matches your card's width (85.6 mm).
                  </p>
                  <div className="flex justify-center py-2">
                    <div
                      style={{ width: `${cardWidthPx}px`, height: '44px' }}
                      className="border-2 border-dashed border-amber-500 rounded-lg bg-white/70 flex items-center justify-center font-bold text-amber-900 text-[10px] uppercase tracking-wider transition-all"
                    >
                      Credit Card Width (85.6 mm)
                    </div>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="450"
                    step="1"
                    value={cardWidthPx}
                    onChange={handleCardSliderChange}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-800">
                    <span>Smaller</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPixelsPerMm(3.8);
                        setCardWidthPx(85.6 * 3.8);
                      }}
                      className="underline font-bold"
                    >
                      Reset Default
                    </button>
                    <span>Larger</span>
                  </div>
                </div>
              )}

              {/* Visual Ring Circle Target Area */}
              <div className="flex flex-col items-center justify-center py-6 bg-[#faf7f9] rounded-2xl border border-[#eedbe6] relative min-h-[220px]">
                {/* Physical Ring Circle */}
                <div
                  style={{
                    width: `${circlePixelSize}px`,
                    height: `${circlePixelSize}px`,
                  }}
                  className="rounded-full border-4 border-[#D30915] bg-[#fff0f3]/70 flex flex-col items-center justify-center transition-all duration-100 shadow-[0_0_20px_rgba(211,9,21,0.15)] relative"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D30915] mb-0.5" />
                  <span className="text-[11px] font-mono font-black text-[#D30915]">
                    {interactiveDiameterMm.toFixed(1)} mm
                  </span>
                  <span className="text-[9px] uppercase font-bold text-[#716d77]">
                    Size {nearestSizeFromDiameter.usSize}
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-xs uppercase font-bold text-[#716d77] tracking-wider mb-0.5">
                    Closest Candle Reveal Match
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#eedbe6] shadow-2xs">
                    <span className="text-sm font-black text-[#D30915]">
                      US Size {nearestSizeFromDiameter.usSize}
                    </span>
                    <span className="text-xs text-[#716d77]">
                      ({nearestSizeFromDiameter.diameterMm} mm inside diameter)
                    </span>
                  </div>
                </div>
              </div>

              {/* Diameter Slider & Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#141219]">
                  <span>Adjust Ring Circle Diameter</span>
                  <span className="font-mono text-[#D30915]">{interactiveDiameterMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="15.0"
                  max="20.5"
                  step="0.1"
                  value={interactiveDiameterMm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setInteractiveDiameterMm(val);
                    setSelectedSize(nearestSizeFromDiameter.usSize);
                  }}
                  className="w-full accent-[#D30915] cursor-pointer h-2 bg-[#f4ebf1] rounded-lg"
                />
                <div className="flex justify-between text-[11px] font-medium text-[#716d77]">
                  <span>15.0 mm (Size 4)</span>
                  <span>17.3 mm (Size 7)</span>
                  <span>20.5 mm (Size 11)</span>
                </div>
              </div>

              {/* Quick Size Jump Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-[#716d77] block">Or Click Available Candle Sizes:</span>
                <div className="grid grid-cols-6 gap-2">
                  {RING_SIZE_SPECS.map((spec) => (
                    <button
                      key={spec.usSize}
                      type="button"
                      onClick={() => {
                        setInteractiveDiameterMm(spec.diameterMm);
                        setSelectedSize(spec.usSize);
                      }}
                      className={`py-2 rounded-xl text-center border font-bold text-xs cursor-pointer transition-all ${
                        nearestSizeFromDiameter.usSize === spec.usSize
                          ? 'border-[#D30915] bg-[#fff0f3] text-[#D30915] font-black scale-105 shadow-2xs'
                          : 'border-[#eedbe6] bg-white text-[#55505a] hover:border-[#D30915]/40'
                      }`}
                    >
                      <span>{spec.usSize}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: MEASURE FINGER WITH PAPER STRIP
          ================================================================ */}
          {activeTab === 'finger' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#faf7f9] rounded-2xl border border-[#eedbe6] text-xs text-[#55505a] space-y-2">
                <div className="font-bold text-[#141219] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D30915]" />
                  <span>3 Simple Steps To Measure With Paper:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>Cut a thin strip of paper about 10 cm (4 inches) long.</li>
                  <li>Wrap it comfortably around the base of your intended finger.</li>
                  <li>Mark the exact spot where the paper overlaps with a pen.</li>
                  <li>Measure the marked length in millimeters with any ruler.</li>
                </ol>
              </div>

              {/* Finger Circumference Slider */}
              <div className="p-5 bg-[#faf7f9] rounded-2xl border border-[#eedbe6] space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#141219]">
                  <span>Your Finger Circumference:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="45"
                      max="70"
                      step="0.5"
                      value={fingerCircumferenceMm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 54.4;
                        setFingerCircumferenceMm(val);
                        setSelectedSize(nearestSizeFromCircumference.usSize);
                      }}
                      className="w-16 h-8 px-2 rounded-lg bg-white border border-[#eedbe6] font-mono font-bold text-center text-xs focus:outline-none focus:border-[#D30915]"
                    />
                    <span className="text-xs text-[#716d77]">mm</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="48.0"
                  max="65.0"
                  step="0.2"
                  value={fingerCircumferenceMm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setFingerCircumferenceMm(val);
                    setSelectedSize(nearestSizeFromCircumference.usSize);
                  }}
                  className="w-full accent-[#D30915] cursor-pointer h-2 bg-[#f4ebf1] rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-[#716d77]">
                  <span>48 mm (Small)</span>
                  <span>54.4 mm (Average)</span>
                  <span>65 mm (Large)</span>
                </div>

                {/* Match Result Display */}
                <div className="p-4 rounded-xl bg-white border-2 border-emerald-300 text-center shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Your Recommended Candle Ring Size
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-display">
                    US Size {nearestSizeFromCircumference.usSize}
                  </div>
                  <p className="text-[11px] text-[#716d77] m-0 mt-1">
                    Circumference: {nearestSizeFromCircumference.circumferenceMm} mm • Diameter: {nearestSizeFromCircumference.diameterMm} mm
                  </p>
                </div>
              </div>

              {/* Fit Tip */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Jeweler's Tip:</strong> If your knuckle is noticeably larger than your finger base, measure both and choose a size in between. When in doubt, size up!
                </span>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: OFFICIAL SIZE & CONVERSION CHART
          ================================================================ */}
          {activeTab === 'chart' && (
            <div className="space-y-3">
              <p className="text-xs text-[#716d77] m-0">
                Click any row below to directly choose that size for your candle jewelry reveal:
              </p>

              <div className="overflow-x-auto rounded-xl border border-[#eedbe6]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf7f9] text-[#716d77] font-bold border-b border-[#eedbe6]">
                    <tr>
                      <th className="py-2.5 px-3">US Size</th>
                      <th className="py-2.5 px-3">Diameter</th>
                      <th className="py-2.5 px-3">Circumference</th>
                      <th className="py-2.5 px-3">UK / AU</th>
                      <th className="py-2.5 px-3">EU</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eedbe6]/60">
                    {RING_SIZE_SPECS.map((spec) => {
                      const isSelected = selectedSize === spec.usSize;
                      return (
                        <tr
                          key={spec.usSize}
                          onClick={() => setSelectedSize(spec.usSize)}
                          className={`hover:bg-[#fff0f3]/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#fff0f3] font-bold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 font-black text-[#D30915]">
                              {spec.usSize}
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#D30915]" />}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{spec.diameterMm} mm</td>
                          <td className="py-2.5 px-3 font-mono">{spec.circumferenceMm} mm</td>
                          <td className="py-2.5 px-3">{spec.ukSize}</td>
                          <td className="py-2.5 px-3">{spec.euSize}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-[#D30915] text-white'
                                  : 'bg-[#faf7f9] text-[#716d77] border border-[#eedbe6]'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:p-5 bg-[#fdfafc] border-t border-[#eedbe6] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8a858f] block">Chosen Ring Size</span>
            <span className="text-base sm:text-lg font-black text-[#D30915]">
              Size {activeTab === 'ring' ? nearestSizeFromDiameter.usSize : activeTab === 'finger' ? nearestSizeFromCircumference.usSize : selectedSize} (US)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#eedbe6] hover:bg-gray-50 text-xs font-bold text-[#716d77] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const finalSize =
                  activeTab === 'ring'
                    ? nearestSizeFromDiameter.usSize
                    : activeTab === 'finger'
                    ? nearestSizeFromCircumference.usSize
                    : selectedSize;
                handleApplySize(finalSize);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_rgba(211,9,21,0.25)]"
            >
              <span>Apply Size</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
