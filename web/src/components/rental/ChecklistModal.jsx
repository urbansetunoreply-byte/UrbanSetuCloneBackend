import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaClock, FaHome, FaSignInAlt, FaSignOutAlt, FaImage, FaVideo, FaPlus, FaTrash, FaSave, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import ConditionImageUpload from './ConditionImageUpload';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ROOM_OPTIONS = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'parking', label: 'Parking' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'other', label: 'Other' }
];

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'damaged', label: 'Damaged' }
];

const AMENITY_TYPES = [
  'Furniture', 'Appliances', 'Fixtures', 'Lighting', 'Flooring', 'Windows', 'Doors', 'Walls', 'Plumbing', 'Electrical', 'Other'
];

export default function ChecklistModal({ contract, checklist, checklistType, onClose, onUpdate }) {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [notes, setNotes] = useState('');
  const [isTenant, setIsTenant] = useState(false);
  const [isLandlord, setIsLandlord] = useState(false);

  useEffect(() => {
    if (contract && currentUser) {
      setIsTenant(contract.tenantId?._id === currentUser._id || contract.tenantId === currentUser._id);
      setIsLandlord(contract.landlordId?._id === currentUser._id || contract.landlordId === currentUser._id);
    }
  }, [contract, currentUser]);

  useEffect(() => {
    if (checklist) {
      setImages(checklist.images || []);
      setVideos(checklist.videos || []);
      setRooms(checklist.rooms || []);
      setAmenities(checklist.amenities || []);
      setNotes(isTenant ? (checklist.tenantNotes || '') : (checklist.landlordNotes || ''));
    } else {
      // Initialize with default rooms if new checklist
      const defaultRooms = [
        { roomName: 'Living Room', condition: 'good', notes: '', damages: [] },
        { roomName: 'Bedroom', condition: 'good', notes: '', damages: [] },
        { roomName: 'Kitchen', condition: 'good', notes: '', damages: [] },
        { roomName: 'Bathroom', condition: 'good', notes: '', damages: [] }
      ];
      setRooms(defaultRooms);
      setImages([]);
      setVideos([]);
      setAmenities([]);
      setNotes('');
    }
  }, [checklist, isTenant]);

  const handleCreateOrUpdate = async () => {
    try {
      setSaving(true);
      let checklistId = checklist?._id;

      // Create checklist if it doesn't exist
      if (!checklistId) {
        const createRes = await fetch(`${API_BASE_URL}/api/rental/checklist/${contract._id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: checklistType })
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.message || 'Failed to create checklist');
        }

        checklistId = createData.checklist._id;
      }

      // Update checklist
      const endpoint = checklistType === 'move_in' 
        ? `${API_BASE_URL}/api/rental/checklist/move-in/${checklistId}`
        : `${API_BASE_URL}/api/rental/checklist/move-out/${checklistId}`;

      const updateRes = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          videos,
          rooms,
          amenities,
          notes
        })
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.message || 'Failed to update checklist');
      }

      toast.success(`${checklistType === 'move_in' ? 'Move-in' : 'Move-out'} checklist saved`);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to save checklist');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!checklist?._id) {
      toast.error('Please save the checklist first');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/rental/checklist/move-in/${checklist._id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve checklist');
      }

      toast.success('Checklist approved');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to approve checklist');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addRoom = () => {
    setRooms([...rooms, { roomName: '', condition: 'good', notes: '', damages: [] }]);
  };

  const updateRoom = (index, updates) => {
    const newRooms = rooms.map((room, i) => 
      i === index ? { ...room, ...updates } : room
    );
    setRooms(newRooms);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const addDamage = (roomIndex) => {
    const newRooms = rooms.map((room, i) => {
      if (i === roomIndex) {
        return {
          ...room,
          damages: [...(room.damages || []), { description: '', estimatedCost: 0, imageUrl: '' }]
        };
      }
      return room;
    });
    setRooms(newRooms);
  };

  const updateDamage = (roomIndex, damageIndex, updates) => {
    const newRooms = rooms.map((room, i) => {
      if (i === roomIndex) {
        const newDamages = room.damages.map((damage, j) =>
          j === damageIndex ? { ...damage, ...updates } : damage
        );
        return { ...room, damages: newDamages };
      }
      return room;
    });
    setRooms(newRooms);
  };

  const removeDamage = (roomIndex, damageIndex) => {
    const newRooms = rooms.map((room, i) => {
      if (i === roomIndex) {
        return {
          ...room,
          damages: room.damages.filter((_, j) => j !== damageIndex)
        };
      }
      return room;
    });
    setRooms(newRooms);
  };

  const addAmenity = () => {
    setAmenities([...amenities, { name: '', condition: 'good', working: true, notes: '' }]);
  };

  const updateAmenity = (index, updates) => {
    const newAmenities = amenities.map((amenity, i) =>
      i === index ? { ...amenity, ...updates } : amenity
    );
    setAmenities(newAmenities);
  };

  const removeAmenity = (index) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleImageUpdate = ({ images: newImages, videos: newVideos }) => {
    setImages(newImages || images);
    setVideos(newVideos || videos);
  };

  const canEdit = !checklist || checklist.status === 'in_progress' || (checklistType === 'move_in' && checklist.status === 'pending_approval' && ((isTenant && !checklist.tenantApproved) || (isLandlord && !checklist.landlordApproved)));
  const canApprove = checklist && checklistType === 'move_in' && ((isTenant && !checklist.tenantApproved) || (isLandlord && !checklist.landlordApproved));
  const showApprovalStatus = checklist && (checklist.tenantApproved || checklist.landlordApproved);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-2">
            {checklistType === 'move_in' ? <FaSignInAlt /> : <FaSignOutAlt />}
            <h2 className="text-xl font-bold">
              {checklistType === 'move_in' ? 'Move-In' : 'Move-Out'} Checklist
            </h2>
            {contract?.listingId?.name && (
              <span className="text-sm opacity-90">- {contract.listingId.name}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status Info */}
          {checklist && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">Status: 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    checklist.status === 'approved' || checklist.status === 'completed' ? 'bg-green-100 text-green-800' :
                    checklist.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {checklist.status}
                  </span>
                </div>
                {showApprovalStatus && (
                  <div className="text-sm text-gray-600 mt-1">
                    {checklist.tenantApproved && <span className="flex items-center gap-1"><FaCheckCircle className="text-green-600" /> Tenant Approved</span>}
                    {checklist.landlordApproved && <span className="flex items-center gap-1 ml-3"><FaCheckCircle className="text-green-600" /> Landlord Approved</span>}
                  </div>
                )}
              </div>
              {checklist.checklistId && (
                <div className="text-xs text-gray-500">ID: {checklist.checklistId}</div>
              )}
            </div>
          )}

          {/* Images and Videos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FaCamera /> Property Condition Documentation
            </h3>
            <ConditionImageUpload
              existingImages={images}
              existingVideos={videos}
              onUpdate={handleImageUpdate}
              readOnly={!canEdit}
            />
          </div>

          {/* Room-wise Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaHome /> Room-wise Condition
              </h3>
              {canEdit && (
                <button
                  onClick={addRoom}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                >
                  <FaPlus /> Add Room
                </button>
              )}
            </div>
            <div className="space-y-4">
              {rooms.map((room, roomIndex) => (
                <div key={roomIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {canEdit ? (
                      <>
                        <input
                          type="text"
                          placeholder="Room Name"
                          value={room.roomName || ''}
                          onChange={(e) => updateRoom(roomIndex, { roomName: e.target.value })}
                          className="border rounded p-2"
                        />
                        <select
                          value={room.condition || 'good'}
                          onChange={(e) => updateRoom(roomIndex, { condition: e.target.value })}
                          className="border rounded p-2"
                        >
                          {CONDITION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Notes"
                            value={room.notes || ''}
                            onChange={(e) => updateRoom(roomIndex, { notes: e.target.value })}
                            className="flex-1 border rounded p-2"
                          />
                          <button
                            onClick={() => removeRoom(roomIndex)}
                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold">{room.roomName || 'Unnamed Room'}</div>
                        <div className={`px-2 py-1 rounded text-sm ${
                          room.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                          room.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                          room.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                          room.condition === 'poor' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {CONDITION_OPTIONS.find(o => o.value === room.condition)?.label || room.condition}
                        </div>
                        <div className="text-sm text-gray-600">{room.notes || 'No notes'}</div>
                      </>
                    )}
                  </div>

                  {/* Damages (Move-Out only) */}
                  {checklistType === 'move_out' && (
                    <div className="mt-3 pl-4 border-l-2 border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-red-700">Damages</h4>
                        {canEdit && (
                          <button
                            onClick={() => addDamage(roomIndex)}
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 flex items-center gap-1"
                          >
                            <FaPlus /> Add Damage
                          </button>
                        )}
                      </div>
                      {room.damages && room.damages.length > 0 ? (
                        <div className="space-y-2">
                          {room.damages.map((damage, damageIndex) => (
                            <div key={damageIndex} className="bg-red-50 rounded p-2 flex gap-2">
                              {canEdit ? (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Damage description"
                                    value={damage.description || ''}
                                    onChange={(e) => updateDamage(roomIndex, damageIndex, { description: e.target.value })}
                                    className="flex-1 border rounded p-1 text-sm"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Cost (₹)"
                                    value={damage.estimatedCost || ''}
                                    onChange={(e) => updateDamage(roomIndex, damageIndex, { estimatedCost: parseFloat(e.target.value) || 0 })}
                                    className="w-24 border rounded p-1 text-sm"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => removeDamage(roomIndex, damageIndex)}
                                    className="p-1 bg-red-200 text-red-700 rounded hover:bg-red-300"
                                  >
                                    <FaTrash className="text-xs" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex-1 text-sm">
                                    <div className="font-medium">{damage.description || 'No description'}</div>
                                    <div className="text-xs text-gray-600">Est. Cost: ₹{damage.estimatedCost?.toLocaleString() || 0}</div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No damages recorded</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Amenities Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Amenities Checklist</h3>
              {canEdit && (
                <button
                  onClick={addAmenity}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
                >
                  <FaPlus /> Add Amenity
                </button>
              )}
            </div>
            <div className="space-y-2">
              {amenities.map((amenity, index) => (
                <div key={index} className="border rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
                  {canEdit ? (
                    <>
                      <input
                        type="text"
                        placeholder="Amenity name"
                        value={amenity.name || ''}
                        onChange={(e) => updateAmenity(index, { name: e.target.value })}
                        className="border rounded p-2"
                      />
                      <select
                        value={amenity.condition || 'good'}
                        onChange={(e) => updateAmenity(index, { condition: e.target.value })}
                        className="border rounded p-2"
                      >
                        {CONDITION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-2 border rounded p-2">
                        <input
                          type="checkbox"
                          checked={amenity.working !== false}
                          onChange={(e) => updateAmenity(index, { working: e.target.checked })}
                        />
                        <span className="text-sm">Working</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Notes"
                          value={amenity.notes || ''}
                          onChange={(e) => updateAmenity(index, { notes: e.target.value })}
                          className="flex-1 border rounded p-2"
                        />
                        <button
                          onClick={() => removeAmenity(index)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium">{amenity.name || 'Unnamed'}</div>
                      <div className={`px-2 py-1 rounded text-sm ${
                        amenity.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                        amenity.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {CONDITION_OPTIONS.find(o => o.value === amenity.condition)?.label || amenity.condition}
                      </div>
                      <div className={`px-2 py-1 rounded text-sm ${
                        amenity.working ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {amenity.working ? 'Working' : 'Not Working'}
                      </div>
                      <div className="text-sm text-gray-600">{amenity.notes || 'No notes'}</div>
                    </>
                  )}
                </div>
              ))}
              {amenities.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No amenities added yet</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border rounded p-2"
              placeholder="Additional notes or comments..."
              readOnly={!canEdit}
            />
          </div>

          {/* Damage Assessment (Move-Out, Read-only for tenants) */}
          {checklistType === 'move_out' && checklist?.damageAssessment && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Damage Assessment</h3>
              <div className="space-y-1 text-sm">
                <div>Total Damage Cost: <span className="font-semibold">₹{checklist.damageAssessment.totalDamageCost?.toLocaleString() || 0}</span></div>
                <div>Deducted from Deposit: <span className="font-semibold">₹{checklist.damageAssessment.deductedFromDeposit?.toLocaleString() || 0}</span></div>
                {checklist.damageAssessment.assessmentNotes && (
                  <div className="mt-2 text-gray-700">{checklist.damageAssessment.assessmentNotes}</div>
                )}
                {checklist.damageAssessment.assessedAt && (
                  <div className="text-xs text-gray-500 mt-2">
                    Assessed on: {new Date(checklist.damageAssessment.assessedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Close
          </button>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Checklist'}
              </button>
            )}
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FaCheckCircle /> {loading ? 'Approving...' : 'Approve Checklist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

