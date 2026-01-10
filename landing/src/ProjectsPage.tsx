import { type JSX } from "react";
import Header from "./components/Header";
import ArrowButton from "./components/ArrowButton";
import "./App.css";
import "./projects-page.css";

type Project = {
    title: string;
    img: string;
    tags: string[];
};

const projects: Project[] = [
    {
        title: "Хакатон курсов",
        img: "/images/project_image.svg",
        tags: ["МИСИС", "Курсы", "Хакатон"],
    },
    {
        title: "ИКН Фест 2025",
        img: "/images/project_image-2.svg",
        tags: ["МИСИС", "Мероприятие"],
    },
    {
        title: "Креатон",
        img: "/images/project_image-3.svg",
        tags: ["МИСИС", "Хакатон", "Дизайн"],
    },
    {
        title: "Фестиваль ИКН 2024",
        img: "/images/project_image-4.svg",
        tags: ["МИСИС", "Мероприятие"],
    },
    {
        title: "Проект AI-команды",
        img: "/images/project_image-5.svg",
        tags: ["МИСИС", "AI", "Исследование"],
    },
    {
        title: "Студенческий медиапроект",
        img: "/images/project_image-2.svg",
        tags: ["МИСИС", "Медиа"],
    },
];

export default function ProjectsPage(): JSX.Element {
    return (
        <div className="page">
            <Header />
            <main>
                <section className="projectsPage">
                    <div className="container projectsPage__container">
                        <header className="projectsPage__hero">
                            <h1 className="projectsPage__title">Проекты</h1>
                            <div className="projectsPage__filters">
                                <button
                                    className="projectsPage__filter projectsPage__filter--active"
                                    type="button"
                                >
                                    Все
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    Хакатон-клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    Дизайн клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    Геймдев клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    Робот клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    АСМ клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    CTF клуб
                                </button>
                                <button className="projectsPage__filter" type="button">
                                    AIKC клуб
                                </button>
                            </div>
                        </header>

                        <div className="projectsPage__divider" />

                        <div className="projectsPage__grid">
                            {projects.map((project) => (
                                <article
                                    key={project.title}
                                    className="projectsPage__card"
                                >
                                    <img
                                        className="projectsPage__image"
                                        src={project.img}
                                        alt={project.title}
                                        loading="lazy"
                                    />

                                    <div className="projectsPage__cardFooter">
                                        <div className="projectsPage__cardInfo">
                                            <h2 className="projectsPage__cardTitle">
                                                {project.title}
                                            </h2>
                                            <div className="projectsPage__tags">
                                                {project.tags.map((tag) => (
                                                    <span
                                                        className="projectsPage__tag"
                                                        key={project.title + tag}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <ArrowButton
                                            className="projectsPage__iconButton"
                                            iconClassName="achievements__Icon"
                                            label=""
                                            aria-label="Открыть проект"
                                        />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
