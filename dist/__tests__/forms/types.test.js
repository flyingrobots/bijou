import { describe, it, expect } from 'vitest';
describe('forms/types', () => {
    it('ValidationResult represents valid state', () => {
        const result = { valid: true };
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
    });
    it('ValidationResult represents invalid state with message', () => {
        const result = { valid: false, message: 'Too short' };
        expect(result.valid).toBe(false);
        expect(result.message).toBe('Too short');
    });
    it('Validator function type works', () => {
        const validator = (value) => ({
            valid: value.length >= 3,
            message: value.length < 3 ? 'Min 3 characters' : undefined,
        });
        expect(validator('ab')).toEqual({ valid: false, message: 'Min 3 characters' });
        expect(validator('abc')).toEqual({ valid: true, message: undefined });
    });
    it('FieldOptions type compiles', () => {
        const opts = {
            title: 'Name',
            defaultValue: 'John',
            required: true,
        };
        expect(opts.title).toBe('Name');
    });
    it('SelectOption type compiles', () => {
        const opt = { label: 'One', value: 1, description: 'First' };
        expect(opt.value).toBe(1);
    });
    it('SelectFieldOptions type compiles', () => {
        const opts = {
            title: 'Pick',
            options: [{ label: 'A', value: 'a' }],
        };
        expect(opts.options).toHaveLength(1);
    });
    it('ConfirmFieldOptions type compiles', () => {
        const opts = {
            title: 'Continue?',
            defaultValue: false,
        };
        expect(opts.defaultValue).toBe(false);
    });
    it('GroupFieldResult type compiles', () => {
        const result = {
            values: { name: 'Alice', age: 30 },
            cancelled: false,
        };
        expect(result.values.name).toBe('Alice');
        expect(result.cancelled).toBe(false);
    });
});
//# sourceMappingURL=types.test.js.map