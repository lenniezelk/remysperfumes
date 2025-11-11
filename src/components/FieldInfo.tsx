import type { AnyFieldApi } from '@tanstack/react-form'

export function FieldInfo({ field }: { field: AnyFieldApi }) {
    return (
        <>
            {field.state.meta.isTouched && !field.state.meta.isValid ? (
                <em className="text-ui-error font-bold text-sm">{field.state.meta.errors.map((error, index) => <span key={index}>{error.message}</span>)}</em>
            ) : null}
            {field.state.meta.isValidating ? 'Validating...' : null}
        </>
    )
}