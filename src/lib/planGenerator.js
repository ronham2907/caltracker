// Offline workout + nutrition plan generator

const EXERCISE_DB = {
  // strength / gym
  gym_gain_beginner: [
    { name: 'Barbell Squat',      muscle: 'Legs',   sets: 3, reps: '8-10' },
    { name: 'Bench Press',        muscle: 'Chest',  sets: 3, reps: '8-10' },
    { name: 'Bent-Over Row',      muscle: 'Back',   sets: 3, reps: '8-10' },
    { name: 'Overhead Press',     muscle: 'Shoulder',sets:3, reps: '8-10' },
    { name: 'Romanian Deadlift',  muscle: 'Legs',   sets: 3, reps: '10-12'},
    { name: 'Dumbbell Curl',      muscle: 'Bicep',  sets: 3, reps: '12'   },
    { name: 'Tricep Pushdown',    muscle: 'Tricep', sets: 3, reps: '12'   },
    { name: 'Lat Pulldown',       muscle: 'Back',   sets: 3, reps: '10-12'},
    { name: 'Leg Press',          muscle: 'Legs',   sets: 3, reps: '10-12'},
    { name: 'Cable Fly',          muscle: 'Chest',  sets: 3, reps: '12-15'},
  ],
  gym_gain_intermediate: [
    { name: 'Deadlift',           muscle: 'Full Body', sets: 4, reps: '5-6' },
    { name: 'Barbell Squat',      muscle: 'Legs',      sets: 4, reps: '6-8' },
    { name: 'Incline Bench Press',muscle: 'Chest',     sets: 4, reps: '6-8' },
    { name: 'Weighted Pull-Up',   muscle: 'Back',      sets: 4, reps: '6-8' },
    { name: 'Barbell Row',        muscle: 'Back',      sets: 3, reps: '8'   },
    { name: 'Military Press',     muscle: 'Shoulder',  sets: 4, reps: '6-8' },
    { name: 'Bulgarian Split Squat',muscle:'Legs',     sets: 3, reps: '10'  },
    { name: 'Dips',               muscle: 'Tricep',    sets: 3, reps: '10-12'},
    { name: 'Hammer Curl',        muscle: 'Bicep',     sets: 3, reps: '12'  },
    { name: 'Face Pull',          muscle: 'Shoulder',  sets: 3, reps: '15'  },
  ],
  home_gain_beginner: [
    { name: 'Push-Up',            muscle: 'Chest',  sets: 3, reps: '10-15' },
    { name: 'Bodyweight Squat',   muscle: 'Legs',   sets: 3, reps: '15-20' },
    { name: 'Pike Push-Up',       muscle: 'Shoulder',sets:3, reps: '10-12' },
    { name: 'Inverted Row',       muscle: 'Back',   sets: 3, reps: '10-12' },
    { name: 'Glute Bridge',       muscle: 'Glutes', sets: 3, reps: '15-20' },
    { name: 'Tricep Dip (chair)', muscle: 'Tricep', sets: 3, reps: '12-15' },
    { name: 'Plank',              muscle: 'Core',   sets: 3, reps: '30-45s' },
    { name: 'Lunge',              muscle: 'Legs',   sets: 3, reps: '12/leg' },
  ],
  home_lose_beginner: [
    { name: 'Jumping Jacks',      muscle: 'Cardio', sets: 3, reps: '30s' },
    { name: 'Burpee',             muscle: 'Full Body', sets: 3, reps: '10' },
    { name: 'Mountain Climber',   muscle: 'Core',   sets: 3, reps: '30s' },
    { name: 'High Knees',         muscle: 'Cardio', sets: 3, reps: '30s' },
    { name: 'Squat Jump',         muscle: 'Legs',   sets: 3, reps: '12' },
    { name: 'Push-Up',            muscle: 'Chest',  sets: 3, reps: '10' },
    { name: 'Plank',              muscle: 'Core',   sets: 3, reps: '30s' },
    { name: 'Jump Rope (sim)',     muscle: 'Cardio', sets: 3, reps: '60s' },
  ],
  outdoor_endurance_beginner: [
    { name: 'Easy Run',           muscle: 'Cardio', sets: 1, reps: '20 min' },
    { name: 'Walking Lunges',     muscle: 'Legs',   sets: 3, reps: '12/leg' },
    { name: 'Box Step-Up',        muscle: 'Legs',   sets: 3, reps: '15' },
    { name: 'Sprint Intervals',   muscle: 'Cardio', sets: 6, reps: '30s on/30s off' },
    { name: 'Bodyweight Squat',   muscle: 'Legs',   sets: 3, reps: '20' },
    { name: 'Plank',              muscle: 'Core',   sets: 3, reps: '45s' },
  ],
};

const WORKOUT_TEMPLATES = {
  gain: [
    { name: 'Push Day',    focus: 'Chest, Shoulders, Triceps', duration: 60 },
    { name: 'Pull Day',    focus: 'Back, Biceps',              duration: 55 },
    { name: 'Leg Day',     focus: 'Quads, Hamstrings, Glutes', duration: 60 },
    { name: 'Upper Body',  focus: 'Chest, Back, Shoulders',    duration: 60 },
    { name: 'Full Body A', focus: 'Compound Movements',        duration: 65 },
    { name: 'Full Body B', focus: 'Accessory Work',            duration: 60 },
  ],
  lose: [
    { name: 'HIIT Cardio',     focus: 'Fat Burn, Conditioning', duration: 40 },
    { name: 'Circuit Training',focus: 'Full Body, Metabolic',   duration: 45 },
    { name: 'Strength + Cardio',focus:'Build muscle, burn fat',  duration: 55 },
    { name: 'Active Recovery', focus: 'Low Intensity Cardio',   duration: 35 },
    { name: 'Power HIIT',      focus: 'High Intensity Intervals',duration: 40 },
    { name: 'Metabolic Finisher',focus:'Max Calorie Burn',       duration: 50 },
  ],
  endurance: [
    { name: 'Easy Run',        focus: 'Aerobic Base',            duration: 30 },
    { name: 'Interval Run',    focus: 'Speed Endurance',         duration: 40 },
    { name: 'Long Slow Distance',focus:'Endurance Building',     duration: 60 },
    { name: 'Tempo Run',       focus: 'Lactate Threshold',       duration: 45 },
    { name: 'Cross-Training',  focus: 'Active Recovery',         duration: 40 },
    { name: 'Hill Repeats',    focus: 'Strength Endurance',      duration: 45 },
  ],
  maintain: [
    { name: 'Full Body Strength',focus:'Maintain muscle mass',   duration: 50 },
    { name: 'Cardio Session',  focus: 'Cardiovascular Health',   duration: 40 },
    { name: 'Flexibility + Core',focus:'Mobility, Stability',    duration: 35 },
    { name: 'Sports Performance',focus:'Agility, Speed',         duration: 45 },
    { name: 'Active Recovery', focus: 'Yoga / Light Movement',   duration: 30 },
    { name: 'Full Body Circuit',focus:'Functional Fitness',      duration: 50 },
  ],
};

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function pickDays(count) {
  if (count >= 7) return ALL_DAYS;
  if (count === 6) return ALL_DAYS.slice(0, 6);
  if (count === 5) return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  if (count === 4) return ['Monday', 'Tuesday', 'Thursday', 'Friday'];
  if (count === 3) return ['Monday', 'Wednesday', 'Friday'];
  return ['Tuesday', 'Friday'];
}

function getExercises(goal, level, location) {
  const key = `${location}_${goal}_${level}`;
  if (EXERCISE_DB[key]) return EXERCISE_DB[key];
  // Fallback chain
  const fallbacks = [
    `home_${goal}_${level}`,
    `home_gain_${level}`,
    'home_gain_beginner',
  ];
  for (const k of fallbacks) {
    if (EXERCISE_DB[k]) return EXERCISE_DB[k];
  }
  return EXERCISE_DB['home_gain_beginner'];
}

export function generateWorkoutPlan(profile) {
  const {
    goal_type = 'maintain',
    fitness_level = 'beginner',
    training_days = 3,
    workout_location = 'home',
  } = profile || {};

  const goal = ['lose', 'gain', 'endurance', 'maintain', 'health', 'performance'].includes(goal_type)
    ? (goal_type === 'health' || goal_type === 'performance' ? 'maintain' : goal_type)
    : 'maintain';

  const days = pickDays(training_days);
  const templates = WORKOUT_TEMPLATES[goal] || WORKOUT_TEMPLATES.maintain;
  const exercises = getExercises(goal, fitness_level, workout_location);

  return ALL_DAYS.map(day => {
    const dayIdx = days.indexOf(day);
    if (dayIdx === -1) return { day, rest: true };

    const template = templates[dayIdx % templates.length];
    const dayExercises = exercises
      .slice(dayIdx * 2, dayIdx * 2 + 5)
      .concat(exercises.slice(0, Math.max(0, 5 - exercises.slice(dayIdx * 2, dayIdx * 2 + 5).length)));
    const exercisesToShow = dayExercises.slice(0, 5);

    return {
      day,
      rest: false,
      name: template.name,
      focus: template.focus,
      duration: template.duration,
      exercises: exercisesToShow,
    };
  });
}

// ─── Nutrition plan ─────────────────────────────────────────────────────
const MEAL_DB = {
  none: {
    breakfast: [
      { name: 'Egg White Omelette + Toast',       sub: '3 egg whites, 2 slices whole wheat, veggies' },
      { name: 'Greek Yogurt Parfait',             sub: '200g Greek yogurt, granola, mixed berries' },
      { name: 'Oatmeal with Banana + Peanut Butter', sub: 'Rolled oats, 1 banana, 1 tbsp PB' },
      { name: 'Protein Pancakes',                 sub: '2 eggs, banana, protein powder, berries' },
    ],
    lunch: [
      { name: 'Grilled Chicken Rice Bowl',        sub: 'Chicken breast, brown rice, steamed broccoli' },
      { name: 'Tuna Salad Wrap',                  sub: 'Whole wheat wrap, tuna, lettuce, tomato' },
      { name: 'Salmon + Sweet Potato',            sub: 'Baked salmon, roasted sweet potato, greens' },
      { name: 'Turkey & Avocado Sandwich',        sub: 'Turkey, avo, tomato, whole grain bread' },
    ],
    dinner: [
      { name: 'Baked Chicken + Quinoa',           sub: 'Seasoned chicken breast, quinoa, roasted veg' },
      { name: 'Beef Stir-Fry + Rice',             sub: 'Lean beef, mixed vegetables, jasmine rice' },
      { name: 'Grilled Salmon + Asparagus',       sub: 'Salmon fillet, roasted asparagus, lemon' },
      { name: 'Turkey Meatballs + Pasta',         sub: 'Turkey meatballs, whole grain pasta, marinara' },
    ],
    snack: [
      { name: 'Protein Shake',                    sub: 'Whey protein, almond milk, banana' },
      { name: 'Rice Cake + Almond Butter',        sub: '2 rice cakes, 2 tbsp almond butter' },
      { name: 'Apple + String Cheese',            sub: '1 medium apple, 1-2 string cheese' },
      { name: 'Cottage Cheese + Pineapple',       sub: '150g cottage cheese, pineapple chunks' },
    ],
  },
  vegetarian: {
    breakfast: [
      { name: 'Veggie Scrambled Eggs',            sub: '3 eggs, bell peppers, spinach, feta' },
      { name: 'Smoothie Bowl',                    sub: 'Frozen berries, banana, oats, honey, seeds' },
      { name: 'Avocado Toast + Egg',              sub: '2 eggs, avo, sourdough, cherry tomatoes' },
    ],
    lunch: [
      { name: 'Lentil & Veggie Soup',             sub: 'Red lentils, carrots, celery, spices, bread' },
      { name: 'Chickpea Salad Bowl',              sub: 'Chickpeas, cucumber, tomato, feta, olive oil' },
      { name: 'Caprese Pasta',                    sub: 'Whole grain pasta, mozzarella, tomato, basil' },
    ],
    dinner: [
      { name: 'Paneer Tikka + Rice',              sub: 'Grilled paneer, basmati rice, raita' },
      { name: 'Veggie Stir-Fry + Tofu',           sub: 'Firm tofu, broccoli, peppers, soy sauce, rice' },
      { name: 'Stuffed Bell Peppers',             sub: 'Quinoa, beans, corn, cheese stuffed peppers' },
    ],
    snack: [
      { name: 'Greek Yogurt + Nuts',              sub: '200g Greek yogurt, mixed nuts, honey' },
      { name: 'Hummus + Veg Sticks',              sub: 'Hummus with carrot, cucumber, bell pepper sticks' },
    ],
  },
  vegan: {
    breakfast: [
      { name: 'Overnight Oats',                   sub: 'Oats, almond milk, chia seeds, berries, maple' },
      { name: 'Tofu Scramble',                    sub: 'Crumbled tofu, turmeric, spinach, peppers' },
      { name: 'Green Protein Smoothie',           sub: 'Spinach, banana, pea protein, almond milk' },
    ],
    lunch: [
      { name: 'Black Bean Burrito Bowl',          sub: 'Black beans, brown rice, salsa, guac, corn' },
      { name: 'Tempeh & Veggie Bowl',             sub: 'Marinated tempeh, roasted veg, tahini dressing' },
      { name: 'Lentil Dal + Roti',                sub: 'Spiced red lentils, whole wheat roti, chutney' },
    ],
    dinner: [
      { name: 'Chickpea Curry + Rice',            sub: 'Chickpeas, coconut milk, spices, basmati' },
      { name: 'Vegan Stir-Fry + Noodles',        sub: 'Edamame, mushrooms, tofu, soba noodles' },
      { name: 'Stuffed Portobello Mushrooms',     sub: 'Quinoa, sun-dried tomatoes, spinach stuffing' },
    ],
    snack: [
      { name: 'Mixed Nuts & Dried Fruit',         sub: '30g almonds, walnuts, raisins, dark chocolate' },
      { name: 'Rice Cakes + Tahini',              sub: '2 rice cakes, tahini, sliced banana' },
    ],
  },
  keto: {
    breakfast: [
      { name: 'Bacon & Egg Scramble',             sub: '3 eggs, 3 strips bacon, butter, cheese' },
      { name: 'Avocado & Smoked Salmon',          sub: '1 whole avocado, smoked salmon, capers, lemon' },
      { name: 'Keto Bulletproof Coffee',          sub: 'Black coffee, MCT oil, grass-fed butter' },
    ],
    lunch: [
      { name: 'Chicken Cobb Salad',               sub: 'Chicken, avocado, bacon, egg, blue cheese, ranch' },
      { name: 'Bunless Burger + Salad',           sub: 'Beef patty, cheese, lettuce wrap, side salad' },
      { name: 'Tuna & Avocado Bowl',              sub: 'Tuna, avo, cucumber, olive oil, lemon' },
    ],
    dinner: [
      { name: 'Steak + Roasted Asparagus',        sub: 'Sirloin steak, butter-roasted asparagus, cheese' },
      { name: 'Baked Salmon + Cauliflower Mash',  sub: 'Salmon fillet, cauliflower, butter, cream' },
      { name: 'Ground Beef Stir-Fry',             sub: 'Lean beef, broccoli, peppers, soy sauce, zucchini' },
    ],
    snack: [
      { name: 'Cheese & Salami',                  sub: 'Aged cheddar slices, salami, olives' },
      { name: 'Celery + Almond Butter',           sub: '3 celery sticks, 2 tbsp almond butter' },
    ],
  },
  high_protein: {
    breakfast: [
      { name: 'Protein Oats + Egg Whites',        sub: '60g oats, 4 egg whites, berries, protein powder' },
      { name: 'Cottage Cheese Bowl',              sub: '250g cottage cheese, honey, walnuts, berries' },
      { name: '5-Egg Omelette',                   sub: '5 egg whites, 1 whole egg, spinach, turkey' },
    ],
    lunch: [
      { name: 'Double Chicken Breast + Rice',     sub: '250g chicken, 150g rice, broccoli, hot sauce' },
      { name: 'Protein Power Bowl',               sub: 'Ground turkey, quinoa, beans, salsa, Greek yogurt' },
      { name: 'Shrimp & Egg Fried Rice',          sub: '200g shrimp, 2 eggs, cauliflower rice, veg' },
    ],
    dinner: [
      { name: 'Baked Cod + Lentils',              sub: '200g cod, green lentils, roasted veg, herbs' },
      { name: 'Chicken Thighs + Sweet Potato',    sub: '250g chicken, sweet potato, green beans' },
      { name: 'Beef & Veggie Stew',               sub: 'Lean beef, carrots, potatoes, tomato, herbs' },
    ],
    snack: [
      { name: 'Protein Shake + Banana',           sub: '30g whey protein, 1 banana, almond milk' },
      { name: 'Hard-Boiled Eggs',                 sub: '3 hard-boiled eggs, salt and pepper' },
      { name: 'Greek Yogurt + Protein',           sub: '200g Greek yogurt, 1 scoop protein powder' },
    ],
  },
};

function getMeals(dietType) {
  return MEAL_DB[dietType] || MEAL_DB.none;
}

// generateNutritionPlan returns multiple options per meal so the UI can let
// the user swipe/pick which suggestion to log.
export function generateNutritionPlan(profile) {
  const { diet_type = 'none', daily_calorie_goal = 2000, goal_type = 'maintain' } = profile || {};

  const meals = getMeals(diet_type);

  const calSplit = goal_type === 'lose'
    ? { breakfast: 0.25, lunch: 0.35, dinner: 0.28, snack: 0.12 }
    : goal_type === 'gain'
    ? { breakfast: 0.28, lunch: 0.30, dinner: 0.30, snack: 0.12 }
    : { breakfast: 0.25, lunch: 0.33, dinner: 0.30, snack: 0.12 };

  function buildOptions(mealArr, cals) {
    return mealArr.map(m => ({ ...m, calories: cals }));
  }

  return [
    { type: 'breakfast', options: buildOptions(meals.breakfast, Math.round(daily_calorie_goal * calSplit.breakfast)) },
    { type: 'lunch',     options: buildOptions(meals.lunch,     Math.round(daily_calorie_goal * calSplit.lunch))     },
    { type: 'dinner',    options: buildOptions(meals.dinner,    Math.round(daily_calorie_goal * calSplit.dinner))    },
    { type: 'snack',     options: buildOptions(meals.snack,     Math.round(daily_calorie_goal * calSplit.snack))     },
  ];
}

// ─── BMR / TDEE ──────────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  very_active:1.9,
};

export function calculateBMR(profile) {
  const { weight_kg, height_cm, age, gender = 'male' } = profile || {};
  if (!weight_kg || !height_cm || !age) return null;

  // Mifflin-St Jeor
  const base = 10 * Number(weight_kg) + 6.25 * Number(height_cm) - 5 * Number(age);
  return Math.round(gender === 'female' ? base - 161 : base + 5);
}

export function calculateTDEE(profile) {
  const bmr = calculateBMR(profile);
  if (!bmr) return null;
  const mult = ACTIVITY_MULTIPLIERS[profile?.activity_level] || 1.55;
  return Math.round(bmr * mult);
}

export function calculateCalorieTarget(profile) {
  const tdee = calculateTDEE(profile);
  if (!tdee) return profile?.daily_calorie_goal || 2000;
  switch (profile?.goal_type) {
    case 'lose':        return Math.round(tdee - 500);
    case 'gain':        return Math.round(tdee + 300);
    default:            return tdee;
  }
}
