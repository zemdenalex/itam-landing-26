import { type JSX } from "react";
import Header from "./components/Header";
import ArrowButton from "./components/ArrowButton";
import "./App.css";
import "./media-page.css";

type MediaItem = {
    date: string;
    source: string;
    title: string;
    image: string;
};

const mediaItems: MediaItem[] = [
    {
        date: "18 июн 2024",
        source: "Habr",
        title: "Хакатоны — это не страшно: в НИТУ МИСИС придумали как помочь новичкам",
        image: "https://placehold.co/565x320",
    },
    {
        date: "07 мая 2024",
        source: "Forbes Education",
        title: "Как студенческие IT‑сообщества помогают стартовать в индустрии",
        image: "https://placehold.co/565x320",
    },
    {
        date: "22 апр 2024",
        source: "VC.ru",
        title: "От хакатона до собственной студии: кейс IT at MISIS",
        image: "https://placehold.co/565x320",
    },
    {
        date: "15 мар 2024",
        source: "RB.ru",
        title: "Почему студенты выбирают карьеру через проектные команды",
        image: "https://placehold.co/565x320",
    },
];

export default function MediaPage(): JSX.Element {
    return (
        <div className="page">
            <Header />
            <main>
                <section className="mediaPage">
                    <div className="container mediaPage__container">
                        <div className="mediaPage__heroRow">
                            <header className="mediaPage__hero">
                                <h1 className="mediaPage__title">Упоминания в СМИ</h1>
                                <div className="mediaPage__filters">
                                    <button
                                        className="mediaPage__filter mediaPage__filter--active"
                                        type="button"
                                    >
                                        Все
                                    </button>
                                    <button className="mediaPage__filter" type="button">
                                        2026
                                    </button>
                                    <button className="mediaPage__filter" type="button">
                                        2025
                                    </button>
                                    <button className="mediaPage__filter" type="button">
                                        2024
                                    </button>
                                    <button className="mediaPage__filter" type="button">
                                        2023
                                    </button>
                                </div>
                            </header>


                        </div>

                        <div className="mediaPage__list">
                            <div className="mediaPage__divider" />

                            {mediaItems.map((item) => (
                                <article
                                    key={`${item.source}-${item.date}-${item.title}`}
                                    className="mediaPage__item"
                                >
                                    <div className="mediaPage__row">
                                        <div className="mediaPage__date">{item.date}</div>

                                        <div className="mediaPage__content">
                                            <img
                                                className="mediaPage__image"
                                                src={item.image}
                                                alt={item.title}
                                                loading="lazy"
                                            />

                                            <div className="mediaPage__textColumn">
                                                <div className="mediaPage__meta">
                                                    <div className="mediaPage__badge">
                                                        <div className="mediaPage__badgeLabel">
                                                            {item.source}
                                                        </div>
                                                    </div>
                                                    <h2 className="mediaPage__headline">
                                                        {item.title}
                                                    </h2>
                                                </div>

                                                <ArrowButton
                                                    className="mediaPage__readMore"
                                                    href="#"
                                                    label="Читать подробнее"
                                                    labelClassName="mediaPage__readMoreLabel"
                                                    iconClassName="mediaPage__readMoreIcon"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mediaPage__divider" />
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
