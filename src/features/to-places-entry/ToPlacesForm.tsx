import { useState, useRef } from 'react';
import type { ToPlace } from '../../types'; 
import { Input } from '../../components/shared/Input'; 
import { Button } from '../../components/shared/Button'; 
import { X } from 'lucide-react';
import type { DuplicateCheckFn } from './ToPlacesList';
// 泙 NEW: Imports
import { placeSchema } from '../../schemas';

interface ToPlacesFormProps {
    initialData?: ToPlace;
    onClose: () => void;
    onSave: (toPlace: ToPlace) => void;
    onError: (message: string) => void; 
    checkDuplicates: DuplicateCheckFn;
}

const isValueValid = (value: any): boolean => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return !!value; 
};

const getValidationProp = (value: any) => ({
    hideRequiredIndicator: isValueValid(value)
});

export const ToPlacesForm = ({ initialData, onClose, onSave, onError, checkDuplicates }: ToPlacesFormProps) => {
    const [toPlace, setToPlace] = useState({
        placeName: initialData?.placeName || '',
        shortName: initialData?.shortName || '',
    });

    // 泙 NEW: Validation State
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 泙 NEW: Ref to store active timeouts for each field
    const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // 1. Update State
        setToPlace(prev => ({ ...prev, [name]: value }));
        
        // 2. Clear Immediate Errors
        if (formErrors[name]) {
            setFormErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }

        // 3. Clear Existing Timeout
        if (validationTimeouts.current[name]) {
            clearTimeout(validationTimeouts.current[name]);
        }

        // 4. Delayed Validation (Zod + Duplicate Check)
        validationTimeouts.current[name] = setTimeout(() => {
            // A. Zod Schema Check
            try {
                const fieldSchema = (placeSchema.shape as any)[name];
                if (fieldSchema) {
                    const result = fieldSchema.safeParse(value);
                    if (!result.success) {
                        setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
                        return; // Stop if format invalid
                    }
                }
            } catch (e) {}

            // B. Duplicate Check (using updated state implicitly via value)
            // We need to check duplicates based on the *hypothetical* new state
            // Since we can't access updated state inside closure easily without refs, we construct checking params:
            const checkPlaceName = name === 'placeName' ? value : toPlace.placeName;
            const checkShortName = name === 'shortName' ? value : toPlace.shortName;

            const duplicateErrors = checkDuplicates(
                checkPlaceName, 
                checkShortName, 
                initialData?.id
            );

            if (duplicateErrors.place && name === 'placeName') {
                setFormErrors(prev => ({ ...prev, placeName: duplicateErrors.place! }));
            }
            if (duplicateErrors.short && name === 'shortName') {
                setFormErrors(prev => ({ ...prev, shortName: duplicateErrors.short! }));
            }

        }, 500);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        
        // 泙 1. Validate against Zod Schema
        const validationResult = placeSchema.safeParse(toPlace);

        if (!validationResult.success) {
            const newErrors: Record<string, string> = {};
            validationResult.error.issues.forEach((err: any) => {
                if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
            });
            setFormErrors(newErrors);
            return;
        }

        // 泙 2. Check for duplicates
        const duplicateErrors = checkDuplicates(
            toPlace.placeName, 
            toPlace.shortName, 
            initialData?.id
        );

        if (duplicateErrors.place || duplicateErrors.short) {
            setFormErrors(prev => ({
                 ...prev,
                 placeName: duplicateErrors.place || prev.placeName,
                 shortName: duplicateErrors.short || prev.shortName
             }));
            onError('Cannot save due to duplicate entry.');
            return;
        }

        const savedToPlace: ToPlace = {
            id: initialData?.id || `tp-${Math.random().toString(36).substring(2, 9)}`, 
            placeName: toPlace.placeName.trim(),
            shortName: toPlace.shortName.trim(),
        };
        
        onSave(savedToPlace);
    };

    return (
        <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-96 max-w-lg bg-background rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-muted">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit To Places Entry' : 'Create New To Places Entry'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        
                        <div>
                            <Input 
                                label="Place Name (To)" 
                                id="placeName" 
                                name="placeName" 
                                value={toPlace.placeName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(toPlace.placeName)}
                            />
                            {formErrors.placeName && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.placeName}</p>
                            )}
                        </div>
                        
                        <div>
                            <Input 
                                label="Short Name (To)" 
                                id="shortName" 
                                name="shortName" 
                                value={toPlace.shortName} 
                                onChange={handleChange} 
                                required 
                                { ...getValidationProp(toPlace.shortName)}
                            />
                            {formErrors.shortName && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.shortName}</p>
                            )}
                        </div>
                        
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-muted">
                        <Button type="button" variant="secondary" onClick={onClose} className="w-auto">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-auto"
                        >
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};