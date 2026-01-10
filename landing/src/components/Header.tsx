import { type JSX, useState } from "react";
import "./header.css";

export default function Header(): JSX.Element {
    const [isActive, setIsActive] = useState(false);

    const handleToggleMenu = (): void => {
        setIsActive((prev) => !prev);
    };

    const handleCloseMenu = (): void => {
        setIsActive(false);
    };

    const pathname = window.location.pathname;

    const isHomePage =
        pathname === "/" ||
        pathname === "" ||
        pathname === "/index.html";

    const isProjectsPage = pathname.includes("/projects");
    const isAchievementsPage = pathname.includes("/wins");
    const isMediaPage = pathname.includes("/media");
    const isTeamPage = pathname.includes("/team");

    return (
        <header className="header">
            <div className={isActive ? "header__active" : "header__disabled"}>
                <div className="container header__inner">
                    <div className="brand">
                        <a href="/" onClick={handleCloseMenu}>
                            <img src="/images/Logo.svg" alt="Логотип IT at MISIS" className="brand__mark" />
                        </a>
                    </div>
                    <button
                        type="button"
                        className="header__menu"
                        onClick={handleToggleMenu}
                        aria-label="Открыть меню"
                        aria-pressed={isActive}
                    >
                        <div className="header__menu1line"></div>
                        <div className="header__menu2line"></div>
                        <div className="header__menu3line"></div>
                    </button>
                </div>

                <div className="header__menuPanel">
                    <div className="header__menuColumn header__menuColumn--main">
                        <div className={`header__menuItem ${isHomePage ? "header__menuItem--active" : ""}`}>
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/#highest-point"
                                onClick={handleCloseMenu}
                            >
                                Главная
                            </a>
                        </div>

                        <div className={`header__menuItem ${isProjectsPage ? "header__menuItem--active" : ""}`}>
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/projects"
                                onClick={handleCloseMenu}
                            >
                                Проекты
                            </a>
                        </div>

                        <div className={`header__menuItem ${isAchievementsPage ? "header__menuItem--active" : ""}`}>
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/wins"
                                onClick={handleCloseMenu}
                            >
                                Достижения
                            </a>
                        </div>

                        <div className={`header__menuItem ${isMediaPage ? "header__menuItem--active" : ""}`}>
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/media"
                                onClick={handleCloseMenu}
                            >
                                Упоминания в СМИ
                            </a>
                        </div>

                        <div className={`header__menuItem ${isTeamPage ? "header__menuItem--active" : ""}`}>
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/team"
                                onClick={handleCloseMenu}
                            >
                                Команда
                            </a>
                        </div>

                        <div className="header__menuItem">
                            <div className="header__menuItemDot" />
                            <a
                                className="header__menuItemLabel"
                                href="/"
                                onClick={handleCloseMenu}
                            >
                                Блог
                            </a>
                        </div>
                    </div>

                    <div className="header__menuColumn header__menuColumn--clubs">
                        <div className="header__menuSectionTitle">Клубы</div>

                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/club/hackathon"
                                onClick={handleCloseMenu}
                            >
                                Хакатон
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                Дизайн
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                AI-knowledge
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                Геймдев
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                Робо
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                ACM
                            </a>
                        </div>
                        <div className="header__submenuItem">
                            <div className="header__submenuDot" />
                            <a
                                className="header__submenuLabel"
                                href="/#clubs"
                                onClick={handleCloseMenu}
                            >
                                CTF
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </header>
    );
}
