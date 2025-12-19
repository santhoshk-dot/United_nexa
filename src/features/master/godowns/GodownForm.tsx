import { useState } from 'react';
import type { Godown } from '../../../types';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { X, Save } from 'lucide-react';
import { useData } from '../../../hooks/useData';

interface GodownFormProps {
    initialData?: Godown;
    onClose: () => void;
    onSave: (data: Godown) => void;
}

export const GodownForm = ({ initialData, onClose, onSave }: GodownFormProps) => {
    const { godowns } = useData();
    const [formData, setFormData] = useState<Godown>({
        id: initialData?.id || `gd-${Date.now()}`,
        name: initialData?.name || '',
        totalCapacity: initialData?.totalCapacity || 0,
        availableCapacity: initialData?.availableCapacity || 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // If empty string, set to 0
        if (value === '' || value === '-') {
            setFormData(prev => ({ ...prev, [name]: 0 }));
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setFormData(prev => ({ ...prev, [name]: numValue }));
            }
        }

        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Godown name is required';
        } else {
            // Check for duplicate name (case-insensitive)
            const isDuplicate = godowns.some(g =>
                g.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
                g.id !== initialData?.id
            );
            if (isDuplicate) {
                newErrors.name = 'A godown with this name already exists';
            }
        }

        // Validate available capacity doesn't exceed total capacity
        if ((formData.availableCapacity ?? 0) > (formData.totalCapacity ?? 0)) {
            newErrors.availableCapacity = 'Available capacity cannot be higher than total capacity';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-xl font-bold text-foreground">
                        {initialData ? 'Edit Godown' : 'Add New Godown'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Input
                                label="Godown Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter godown name"
                            />
                            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Input
                                    label="Total Capacity"
                                    name="totalCapacity"
                                    type="number"
                                    value={formData.totalCapacity === 0 ? '' : formData.totalCapacity}
                                    onChange={handleNumberChange}
                                    min="0"
                                    placeholder="0"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Available Capacity"
                                    name="availableCapacity"
                                    type="number"
                                    value={formData.availableCapacity === 0 ? '' : formData.availableCapacity}
                                    onChange={handleNumberChange}
                                    min="0"
                                    placeholder="0"
                                />
                                {errors.availableCapacity && <p className="text-xs text-destructive mt-1">{errors.availableCapacity}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            <Save className="w-4 h-4" />
                            {initialData ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
