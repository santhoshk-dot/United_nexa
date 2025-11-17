import { useState } from 'react';
import type { ToPlace } from '../../types'; 
import { Input } from '../../components/shared/Input'; 
import { Button } from '../../components/shared/Button'; 
import { X } from 'lucide-react';

interface ToPlacesFormProps {
    initialData?: ToPlace;
    onClose: () => void;
    onSave: (toPlace: ToPlace) => void;
}

export const ToPlacesForm = ({ initialData, onClose, onSave }: ToPlacesFormProps) => {
    const [toPlace, setToPlace] = useState({
        placeName: initialData?.placeName || '',
        shortName: initialData?.shortName || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setToPlace(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!toPlace.placeName.trim() || !toPlace.shortName.trim()) {
            alert('Place Name and Short Name are required.');
            return;
        }

        const savedToPlace: ToPlace = {
            id: initialData?.id || `tp-${Math.random().toString(36).substring(2, 9)}`, // Mock ID
            placeName: toPlace.placeName.trim(),
            shortName: toPlace.shortName.trim(),
        };
        
        onSave(savedToPlace);
    };

    return (
        // Modal Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {/* Modal Panel */}
            <div className="relative w-full max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-muted">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit To Places Entry' : 'Create New To Places Entry'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        
                        <Input 
                            label="Place Name (To)" 
                            id="placeName" 
                            name="placeName" 
                            value={toPlace.placeName} 
                            onChange={handleChange} 
                            required 
                        />
                        <Input 
                            label="Short Name (To)" 
                            id="shortName" 
                            name="shortName" 
                            value={toPlace.shortName} 
                            onChange={handleChange} 
                            required 
                        />
                        
                    </div>

                    {/* Modal Footer (Actions) */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
                        <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" className="w-auto">
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};