import { useState, useRef } from 'react';
import { Input } from '../../../../components/shared/Input';
import { Button } from '../../../../components/shared/Button';
import { AppSelect } from '../../../../components/shared/AppSelect';
import { X, Eye, EyeOff } from 'lucide-react';
import type { AppUser } from '../../../../types';
import { useAuth } from '../../../../hooks/useAuth';
import { registerUserSchema } from '../../../../schemas';
import { useToast } from '../../../../contexts/ToastContext';

interface UserFormProps {
  initialData?: AppUser;
  onClose: () => void;
  onSave: (user: AppUser) => void;
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

export const UserForm = ({ initialData, onClose, onSave }: UserFormProps) => {
  const { users } = useAuth();
  const toast = useToast();
  const [emailError, setEmailError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    mobile: initialData?.mobile || '',
    role: initialData?.role || 'user',
  });

  // Ref for debouncing
  const validationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});


  // 泙 NEW: Field Validation Helper
  const validateField = (name: string, value: string) => {
    // Special handling for password in edit mode (optional)
    if (name === 'password' && initialData && value === '') {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next['password'];
        return next;
      });
      return;
    }

    try {
      const fieldSchema = (registerUserSchema.shape as any)[name];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        if (!result.success) {
          setFormErrors(prev => ({ ...prev, [name]: result.error.issues[0].message }));
        } else {
          setFormErrors(prev => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
        }
      }
    } catch (e) {
      // Ignore if field not in schema (e.g. role might strictly be enum)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // 1. Update State
    setFormData(prev => ({ ...prev, [name]: value }));

    // 2. Clear immediate errors
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (name === 'email' && emailError) {
      setEmailError("");
    }

    // 3. Clear pending timeouts
    if (validationTimeouts.current[name]) {
      clearTimeout(validationTimeouts.current[name]);
    }

    // 4. Set delayed validation
    validationTimeouts.current[name] = setTimeout(() => {
      // Run Zod Validation
      validateField(name, value);

      // Run Duplicate Email Check
      if (name === 'email') {
        const normalizedEmail = value.trim().toLowerCase();
        const exists = users.some(u =>
          u.email.toLowerCase() === normalizedEmail &&
          u.id !== initialData?.id
        );

        if (exists) {
          setEmailError("This email is already assigned to another user.");
        } else {
          setEmailError("");
        }
      }
    }, 1000); // 1000ms delay
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (emailError) {
      toast.error("Please resolve email errors.");
      return;
    }

    // Dynamic schema validation: Omit password validation if editing and empty
    let validationSchema: any = registerUserSchema;
    if (initialData && !formData.password) {
      validationSchema = registerUserSchema.omit({ password: true });
    }

    const validationResult = validationSchema.safeParse({
      ...formData,
    });

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      // Fix: Use .issues and cast err to any
      validationResult.error.issues.forEach((err: any) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setFormErrors(newErrors);
      toast.error("Please correct the errors in the form.");
      return;
    }

    // 🟢 CLEAN PAYLOAD: Remove empty password before sending to parent/backend
    const finalData = { ...formData };
    if (initialData && !finalData.password) {
      // We cast to any to delete the property safely
      delete (finalData as any).password;
    }

    const userToSave: AppUser = {
      id: initialData?.id || `user-${Date.now()}`,
      ...finalData,
    } as AppUser;

    onSave(userToSave);
  };

  return (
    <div className="fixed -top-6 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-background rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-xl font-semibold text-foreground">
            {initialData ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Input
              label="Full Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              {...getValidationProp(formData.name)}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete={!initialData ? "new-email" : "off"}
              {...getValidationProp(formData.email)}
              className={emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
            {formErrors.email && !emailError && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                {initialData ? "Password (Leave blank to keep)" : "Password"}
                {!initialData && <span className="text-destructive">*</span>}
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required={!initialData}
                  autoComplete={!initialData ? "new-password" : "off"}
                  className="w-full px-3 py-2 bg-background text-foreground border border-muted-foreground/30 rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
            </div>

            <div>
              <Input
                label="Mobile Number"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                {...getValidationProp(formData.mobile)}
              />
              {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
            </div>
          </div>

          <div>
            <AppSelect
              label="Role"
              options={[
                { value: 'user', label: 'User (Operations)' },
                { value: 'admin', label: 'Admin (Full Access)' },
              ]}
              value={formData.role}
              onChange={(val: string) => handleChange({ target: { name: 'role', value: val } } as any)}
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-muted mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!!emailError}
              className={emailError ? "opacity-50 cursor-not-allowed" : ""}
            >
              {initialData ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};