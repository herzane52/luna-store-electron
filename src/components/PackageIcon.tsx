"use client";

import React, { useState } from "react";

interface PackageIconProps {
    src?: string | null;
    name?: string;
    className?: string;
    fallbackSrc?: string;
    type?: string;
}

const PackageIcon: React.FC<PackageIconProps> = ({
    src,
    name,
    className = "",
    fallbackSrc = "/arch-logo.svg",
    type = "explicit"
}) => {
    const [error, setError] = useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
        setError(false);
    }, [src]);

    // If no source is provided or there was a loading error
    if (!src || src.trim() === "" || error) {
        return (
            <img
                src={fallbackSrc}
                alt={name || "Arch"}
                className={`${className} ${type === 'explicit' ? 'opacity-70' : 'opacity-30 grayscale'}`}
            />
        );
    }

    return (
        <img
            src={src}
            alt={name}
            onError={() => {
                console.warn(`Icon failed to load: ${src}, falling back to ${fallbackSrc}`);
                setError(true);
            }}
            className={className}
        />
    );
};

export default PackageIcon;
