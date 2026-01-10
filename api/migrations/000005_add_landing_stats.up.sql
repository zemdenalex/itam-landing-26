-- Additional stats for landing page
INSERT INTO stats (key, value, label) VALUES
    -- Achievements section
    ('achievements_prize_total', '~14 млн', 'Рублей общий выигрыш'),
    ('achievements_prize_year', '2024', 'Год статистики призовых'),
    ('achievements_wins_total', '93', 'Побед и призовых мест'),
    ('achievements_wins_years', '4', 'Лет статистики побед'),
    ('achievements_awards_count', '2', 'Наград "Мастерская побед"'),
    
    -- About section
    ('about_subscribers', '5.500+', 'Подписчиков на всех площадках'),
    ('about_projects_count', '30+', 'Проектов создано'),
    ('about_clubs_count', '7', 'Клубов в платформе'),
    ('about_courses_count', '22+', 'Курсов организовано'),
    
    -- Partners section
    ('partners_count', '20+', 'Компаний-партнеров'),
    ('partners_projects_count', '10+', 'Совместных проектов')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    label = EXCLUDED.label,
    updated_at = NOW();
