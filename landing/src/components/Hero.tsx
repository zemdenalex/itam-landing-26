import { type JSX } from "react";
import "./hero.css";

export default function Hero(): JSX.Element {
    return (
        <section className="hero hero--misis" id="hero">
            <div className="hero__bg" aria-hidden="true" />
            <video
                className="hero__video"
                src="/images/hero_desktop.webm"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
            />

            <div className="container hero__layout" >
                <h1 className="hero__title hero__title--misis">IT at MISIS</h1>

                <p className="hero__desc">
                    ИТ-комьюнити нового поколения, состоящее
                    <br />
                    из мотивированных и талантливых участников.
                </p>

                <a className="hero__more" href="#afterHero" id="afterHero">
                    <svg
                        className="hero__moreIcon"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path d="M11.7161 13.532L17 8.18958V12.9681L10.0452 20L3 12.8768V8.09828L8.37418 13.532V0L11.7161 0V13.532Z" />
                    </svg>
                    <span>Смотреть подробнее</span>
                    <svg
                        className="hero__moreIcon"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <path d="M11.7161 13.532L17 8.18958V12.9681L10.0452 20L3 12.8768V8.09828L8.37418 13.532V0L11.7161 0V13.532Z" />
                    </svg>
                </a>
            </div>
        </section>
    );
}
