import { type JSX, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";

type BaseProps = {
    label: string;
    className?: string;
    labelClassName?: string;
    iconClassName: string;
};

type LinkProps = BaseProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
    };

type ButtonProps = BaseProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: undefined;
    };

export type ArrowButtonProps = LinkProps | ButtonProps;

export default function ArrowButton(props: ArrowButtonProps): JSX.Element {
    const { label, className, labelClassName, iconClassName, href, ...rest } = props;

    const content = (
        <>
            {labelClassName ? (
                <span className={labelClassName}>{label}</span>
            ) : (
                label
            )}
            <svg
                className={iconClassName}
                width="22"
                height="22"
                viewBox="0 0 22 22"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M14.5355 3.92909L13.1213 5.3433L17.7812 10.0031H1.39042V11.9972H17.7812L13.1213 16.657L14.5355 18.0712L21.6066 11.0002L14.5355 3.92909Z" />
            </svg>
        </>
    );

    if (href) {
        return (
            <a className={className} href={href} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
                {content}
            </a>
        );
    }

    return (
        <button
            type="button"
            className={className}
            {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
            {content}
        </button>
    );
}

