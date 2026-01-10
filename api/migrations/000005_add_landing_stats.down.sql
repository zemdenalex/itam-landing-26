DELETE FROM stats WHERE key IN (
    'achievements_prize_total',
    'achievements_prize_year',
    'achievements_wins_total',
    'achievements_wins_years',
    'achievements_awards_count',
    'about_subscribers',
    'about_projects_count',
    'about_clubs_count',
    'about_courses_count',
    'partners_count',
    'partners_projects_count'
);
