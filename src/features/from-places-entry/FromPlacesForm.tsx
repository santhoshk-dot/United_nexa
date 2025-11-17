import { useState } from 'react';
import type { FromPlace } from '../../types'; // Assuming types.ts is in ../../types
import { Input } from '../../components/shared/Input'; // Reusing your shared Input component
import { Button } from '../../components/shared/Button'; // Reusing your shared Button component
import { X } from 'lucide-react';

interface FromPlacesFormProps {
    initialData?: FromPlace;
    onClose: () => void;
    onSave: (fromPlace: FromPlace) => void;
}

export const FromPlacesForm = ({ initialData, onClose, onSave }: FromPlacesFormProps) => {
    const [fromPlace, setFromPlace] = useState({
        placeName: initialData?.placeName || '',
        shortName: initialData?.shortName || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFromPlace(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!fromPlace.placeName.trim() || !fromPlace.shortName.trim()) {
            alert('Place Name and Short Name are required.');
            return;
        }

        const savedFromPlace: FromPlace = {
            id: initialData?.id || `fp-${Math.random().toString(36).substring(2, 9)}`, // Mock ID
            placeName: fromPlace.placeName.trim(),
            shortName: fromPlace.shortName.trim(),
        };
        
        onSave(savedFromPlace);
    };

    return (
        // Modal Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {/* Modal Panel */}
            <div className="relative w-full max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-muted">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit From Places Entry' : 'Create New From Places Entry'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        
                        <Input 
                            label="Place Name" 
                            id="placeName" 
                            name="placeName" 
                            value={fromPlace.placeName} 
                            onChange={handleChange} 
                            required 
                        />
                        <Input 
                            label="Short Name" 
                            id="shortName" 
                            name="shortName" 
                            value={fromPlace.shortName} 
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