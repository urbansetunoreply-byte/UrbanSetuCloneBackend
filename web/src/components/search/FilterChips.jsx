import React from "react";
import Chip from "../ui/Chip";
import { X } from "lucide-react";

export default function FilterChips({ formData, onClear, onRemove }) {
  const chips = [];
  const push = (label, key) => chips.push({ label, key });

  if (formData.type && formData.type !== 'all') push(formData.type === 'rent' ? 'Rent' : 'Sale', 'type');
  if (formData.parking) push('Parking', 'parking');
  if (formData.furnished) push('Furnished', 'furnished');
  if (formData.offer) push('Offer', 'offer');
  if (formData.minPrice) push(`Min ₹${Number(formData.minPrice).toLocaleString('en-IN')}`, 'minPrice');
  if (formData.maxPrice) push(`Max ₹${Number(formData.maxPrice).toLocaleString('en-IN')}`, 'maxPrice');
  if (formData.state) push(formData.state, 'state');
  if (formData.city) push(formData.city, 'city');
  if (formData.bedrooms) push(`${formData.bedrooms} BHK`, 'bedrooms');
  if (formData.bathrooms) push(`${formData.bathrooms} Bath`, 'bathrooms');

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(c => (
        <Chip key={c.key} label={c.label} onRemove={() => onRemove(c.key)} />
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
      >
        <X className="w-3 h-3" /> Clear all
      </button>
    </div>
  );
}
