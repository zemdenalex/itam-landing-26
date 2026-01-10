import { type JSX } from "react";
import Header from "./components/Header";
import "./App.css";
import "./team-page.css";

type Member = {
    name: string;
    role: string;
    avatar: string;
};

const leftColumn: Member[] = [
    {
        name: "Даниил Ефимов",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
    {
        name: "Артем Макаров",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
    {
        name: "Глеб Храмов",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
    {
        name: "Полина Фамилия",
        role: "Менеджер по связи с партнёрами",
        avatar: "https://placehold.co/100x100",
    },
];

const rightColumn: Member[] = [
    {
        name: "Геннадий Альхеев",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
    {
        name: "Иван Григорьев",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
    {
        name: "Агаверд Фамилия",
        role: "Product | Graph | Motion",
        avatar: "https://placehold.co/100x100",
    },
];

export default function TeamPage(): JSX.Element {
    return (
        <div className="page">
            <Header />
            <main>
                <section className="teamPage">
                    <div className="container teamPage__container">
                        <header className="teamPage__hero">
                            <h1 className="teamPage__title">Команда платформы</h1>
                            <div className="teamPage__filters">
                                <button
                                    className="teamPage__filter teamPage__filter--active"
                                    type="button"
                                >
                                    ЦТКИО
                                </button>
                                <button className="teamPage__filter" type="button">
                                    Медиа
                                </button>
                                <button className="teamPage__filter" type="button">
                                    Хакатоны
                                </button>
                                <button className="teamPage__filter" type="button">
                                    Дизайн
                                </button>
                                <button className="teamPage__filter" type="button">
                                    Геймдев
                                </button>
                                <button className="teamPage__filter" type="button">
                                    Робототехника
                                </button>
                                <button className="teamPage__filter" type="button">
                                    АСМ
                                </button>
                                <button className="teamPage__filter" type="button">
                                    CTF
                                </button>
                                <button className="teamPage__filter" type="button">
                                    AIKC
                                </button>
                            </div>
                        </header>

                        <div className="teamPage__divider" />

                        <div className="teamPage__grid">
                            <div className="teamPage__column">
                                {leftColumn.map((member) => (
                                    <article
                                        key={member.name}
                                        className="teamPage__card"
                                    >
                                        <img
                                            className="teamPage__avatar"
                                            src={member.avatar}
                                            alt={member.name}
                                            loading="lazy"
                                        />
                                        <div className="teamPage__cardText">
                                            <div className="teamPage__name">{member.name}</div>
                                            <div className="teamPage__role">{member.role}</div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="teamPage__column">
                                {rightColumn.map((member) => (
                                    <article
                                        key={member.name}
                                        className="teamPage__card"
                                    >
                                        <img
                                            className="teamPage__avatar"
                                            src={member.avatar}
                                            alt={member.name}
                                            loading="lazy"
                                        />
                                        <div className="teamPage__cardText">
                                            <div className="teamPage__name">{member.name}</div>
                                            <div className="teamPage__role">{member.role}</div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

