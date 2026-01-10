import { type JSX, useState, useMemo } from "react";
import "./projects.css";
import ArrowButton from "./ArrowButton";
import { useProjects } from "../hooks/useApi";

export default function Projects(): JSX.Element {
    const { data: apiProjects, loading } = useProjects();

    // Fallback projects for when API is not available
    const fallbackProjects = [
        {
            title: "Хакатон курсов",
            cover_image: "./images/project_image.svg",
            tags: ["МИСИС", "Курсы", "Хакатон"],
        },
        {
            title: "ИКН Фест 2025",
            cover_image: "./images/project_image-2.svg",
            tags: ["МИСИС", "Мероприятие"],
        },
        {
            title: "Креатон",
            cover_image: "./images/project_image-3.svg",
            tags: ["МИСИС", "Хакатон", "Дизайн"],
        },
        {
            title: "Фестиваль ИКН 2024",
            cover_image: "./images/project_image-4.svg",
            tags: ["МИСИС", "Мероприятие"],
        },
    ];

    const projects = useMemo(() => {
        if (apiProjects && apiProjects.length > 0) {
            return apiProjects.map(p => ({
                title: p.title,
                cover_image: p.cover_image || "./images/project_image.svg",
                tags: p.tags || [],
            }));
        }
        return fallbackProjects;
    }, [apiProjects]);

    const [activeIndex, setActiveIndex] = useState(0);

    const currentIndex = activeIndex;
    const trackTransform = `translateX(calc(50vw - 417px - (1072px * ${currentIndex})))`;

    if (loading) {
        return (
            <section className="projects">
                <div className="container">
                    <div className="projects__inner">
                        <div className="projects_header">
                            <div className="projects__title">Проекты</div>
                            <div className="projects__subtitle">Наши продукты</div>
                        </div>
                    </div>
                </div>
                <div className="projects__loading">Загрузка...</div>
            </section>
        );
    }

    return (
        <section className="projects" >
            <div className="container">
                <div className="projects__inner">
                    <div className="projects_header">
                        <div className="projects__title">
                            Проекты
                        </div>
                        <div className="projects__subtitle">
                            Наши продукты
                        </div>
                    </div>
                    <ArrowButton
                        className="projects__button"
                        iconClassName="projects__iconArrowRight"
                        href="/projects"
                        label="Смотреть все"
                    />
                </div>


            </div>
            <div className="projects__carousel">
                <div
                    className="projects__track"
                    style={{ transform: trackTransform }}
                >
                    {projects.map((project, index) => {
                        let positionClass = "projects__card--rest";

                        if (index === activeIndex) {
                            positionClass = "projects__card--current";
                        } else if (index === activeIndex - 1) {
                            positionClass = "projects__card--prev";
                        } else if (index === activeIndex + 1) {
                            positionClass = "projects__card--next";
                        }

                        const isCurrent = index === activeIndex;

                        return (
                            <article
                                className={`projects__card ${positionClass}`}
                                key={project.title}
                                onClick={
                                    isCurrent ? undefined : () => setActiveIndex(index)
                                }
                            >
                                <img
                                    className="projects__cardImage"
                                    src={project.cover_image}
                                    alt={project.title}
                                    loading="lazy"
                                />
                                <div className="projects__cardContent">
                                    <h3 className="projects__cardTitle">{project.title}</h3>
                                    <div className="projects__cardTags">
                                        {project.tags.map((tag) => (
                                            <span className="projects__cardTag" key={tag + project.title}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
