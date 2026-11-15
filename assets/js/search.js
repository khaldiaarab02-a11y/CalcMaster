/* ==========================================================================
   CalcMaster Calculator & Article Registry (50 Calculators | 7 Categories | 10 Articles)
   Canonical catalog powering live search, category hubs, and navigation.
   ========================================================================== */
(function (global) {
  "use strict";

  var CATEGORIES = [
    {
      id: "basic",
      name: "Basic & Math",
      url: "categories/math.html",
      count: 8,
      description: "Everyday arithmetic, scientific expressions, percentages, averages, fractions, ratios, roots, and random numbers."
    },
    {
      id: "finance",
      name: "Financial",
      url: "categories/finance.html",
      count: 12,
      description: "Loans, mortgages, interest, savings, investments, salary, hourly pay, margins, discounts, sales tax, and VAT."
    },
    {
      id: "health",
      name: "Health & Fitness",
      url: "categories/health.html",
      count: 6,
      description: "BMI, BMR, daily calories, ideal weight estimates, water intake, and body fat."
    },
    {
      id: "datetime",
      name: "Date & Time",
      url: "categories/date-time.html",
      count: 6,
      description: "Exact age, date differences, days between dates, working days, shift hours, and time duration."
    },
    {
      id: "converters",
      name: "Unit Converters",
      url: "categories/converters.html",
      count: 8,
      description: "Length, weight, temperature, volume, speed, area, digital storage, and pressure conversions."
    },
    {
      id: "education",
      name: "Education",
      url: "categories/education.html",
      count: 5,
      description: "GPA, weighted course grades, exam scores, weighted averages, and required final exam scores."
    },
    {
      id: "business",
      name: "Business & Marketing",
      url: "categories/business.html",
      count: 5,
      description: "ROI, ROAS, break-even analysis, revenue projections, and retail markup calculations."
    }
  ];

  var CALCULATORS = [
    // A. Basic & Math Calculators (8)
    {
      id: "standard-calculator",
      title: "Standard Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/standard-calculator.html",
      description: "Perform everyday addition, subtraction, multiplication, division, and memory operations.",
      keywords: "basic math add subtract multiply divide keypad",
      popular: false,
      recent: false
    },
    {
      id: "scientific-calculator",
      title: "Scientific Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/scientific-calculator.html",
      description: "Compute trigonometry, logarithms, exponents, factorials, and roots in degrees or radians.",
      keywords: "sin cos tan log ln sqrt power factorial scientific math",
      popular: true,
      recent: false
    },
    {
      id: "percentage-calculator",
      title: "Percentage Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/percentage-calculator.html",
      description: "Find percentages of a number, percentage change, increase, and decrease instantly.",
      keywords: "percent percentage increase decrease ratio",
      popular: true,
      recent: false
    },
    {
      id: "average-calculator",
      title: "Average Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/average-calculator.html",
      description: "Calculate arithmetic mean, median, mode, range, and sum for any list of numbers.",
      keywords: "mean median mode range sum statistics",
      popular: false,
      recent: false
    },
    {
      id: "fraction-calculator",
      title: "Fraction Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/fraction-calculator.html",
      description: "Add, subtract, multiply, divide, and simplify fractions and mixed numbers.",
      keywords: "numerator denominator simplify mixed number fraction",
      popular: false,
      recent: false
    },
    {
      id: "ratio-calculator",
      title: "Ratio Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/ratio-calculator.html",
      description: "Solve missing values in proportions, scale recipes, and simplify aspect ratios.",
      keywords: "proportion scale aspect ratio simplify",
      popular: false,
      recent: false
    },
    {
      id: "square-root-calculator",
      title: "Square Root Calculator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/square-root-calculator.html",
      description: "Calculate principal square roots, cube roots, and custom n-th roots with perfect-square checks.",
      keywords: "sqrt square root cube root nth root radical",
      popular: false,
      recent: true
    },
    {
      id: "random-number-generator",
      title: "Random Number Generator",
      category: "Basic & Math",
      categoryId: "basic",
      url: "calculators/random-number-generator.html",
      description: "Generate uniform random integers or decimals within custom bounds with optional unique draws.",
      keywords: "random number rng dice lottery unique generator",
      popular: false,
      recent: true
    },

    // B. Financial Calculators (12)
    {
      id: "loan-calculator",
      title: "Loan Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/loan-calculator.html",
      description: "Estimate monthly payments, total interest, and full amortization schedule for fixed loans.",
      keywords: "loan payment monthly interest principal amortization",
      popular: true,
      recent: false
    },
    {
      id: "mortgage-calculator",
      title: "Mortgage Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/mortgage-calculator.html",
      description: "Calculate monthly home payments including principal, interest, property tax, and insurance.",
      keywords: "home loan mortgage down payment property tax pmi",
      popular: true,
      recent: false
    },
    {
      id: "simple-interest-calculator",
      title: "Simple Interest Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/simple-interest-calculator.html",
      description: "Compute straightforward interest earned or owed using principal, rate, and time.",
      keywords: "simple interest principal rate time finance",
      popular: false,
      recent: false
    },
    {
      id: "compound-interest-calculator",
      title: "Compound Interest Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/compound-interest-calculator.html",
      description: "Project wealth growth with custom compounding frequencies and regular monthly contributions.",
      keywords: "compound interest compounding savings investment growth",
      popular: true,
      recent: false
    },
    {
      id: "savings-calculator",
      title: "Savings Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/savings-calculator.html",
      description: "Plan savings goals with initial deposit, recurring contributions, and annual yield.",
      keywords: "savings goal deposit interest apy",
      popular: false,
      recent: false
    },
    {
      id: "investment-calculator",
      title: "Investment Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/investment-calculator.html",
      description: "Estimate future portfolio value based on expected annual return and investment horizon.",
      keywords: "investment portfolio return rate future value",
      popular: false,
      recent: false
    },
    {
      id: "salary-calculator",
      title: "Salary Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/salary-calculator.html",
      description: "Convert between hourly, daily, weekly, biweekly, monthly, and annual pay rates.",
      keywords: "hourly wage annual pay paycheck converter",
      popular: false,
      recent: false
    },
    {
      id: "hourly-pay-calculator",
      title: "Hourly Pay Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/hourly-pay-calculator.html",
      description: "Calculate gross pay including regular hours, overtime hours, overtime multipliers, and annual estimates.",
      keywords: "hourly pay overtime wage paycheck gross earnings",
      popular: false,
      recent: true
    },
    {
      id: "profit-margin-calculator",
      title: "Profit Margin Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/profit-margin-calculator.html",
      description: "Determine gross profit margin, net profit, and markup percentage from cost and revenue.",
      keywords: "gross margin net profit cost selling price",
      popular: false,
      recent: false
    },
    {
      id: "discount-calculator",
      title: "Discount Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/discount-calculator.html",
      description: "Calculate sale prices, total savings, and optional stacked discounts in seconds.",
      keywords: "sale price percent off savings discount coupon",
      popular: true,
      recent: false
    },
    {
      id: "sales-tax-calculator",
      title: "Sales Tax Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/sales-tax-calculator.html",
      description: "Add or reverse-calculate sales tax from pre-tax or tax-inclusive prices.",
      keywords: "sales tax pre-tax total receipt",
      popular: false,
      recent: false
    },
    {
      id: "vat-calculator",
      title: "VAT Calculator",
      category: "Financial",
      categoryId: "finance",
      url: "calculators/vat-calculator.html",
      description: "Add or remove Value Added Tax (VAT) for UK, EU, Australian GST, and global rates.",
      keywords: "value added tax vat gst exclude include",
      popular: false,
      recent: false
    },

    // C. Health Calculators (6)
    {
      id: "bmi-calculator",
      title: "BMI Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/bmi-calculator.html",
      description: "Calculate Body Mass Index using metric or imperial units with standard weight categories.",
      keywords: "body mass index weight height health",
      popular: true,
      recent: false
    },
    {
      id: "bmr-calculator",
      title: "BMR Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/bmr-calculator.html",
      description: "Estimate Basal Metabolic Rate using the Mifflin-St Jeor equation.",
      keywords: "basal metabolic rate metabolism resting calories",
      popular: false,
      recent: false
    },
    {
      id: "daily-calorie-calculator",
      title: "Daily Calorie Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/daily-calorie-calculator.html",
      description: "Estimate Total Daily Energy Expenditure (TDEE) for maintenance, loss, or gain goals.",
      keywords: "tdee calories maintenance weight loss gain",
      popular: false,
      recent: false
    },
    {
      id: "ideal-weight-calculator",
      title: "Ideal Weight Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/ideal-weight-calculator.html",
      description: "Compare Devine, Robinson, Miller, and Hamwi healthy weight range estimates by height.",
      keywords: "ideal body weight devine height range",
      popular: false,
      recent: false
    },
    {
      id: "water-intake-calculator",
      title: "Water Intake Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/water-intake-calculator.html",
      description: "Estimate daily hydration targets in liters and fluid ounces based on weight and activity.",
      keywords: "hydration water ounces liters daily intake",
      popular: false,
      recent: false
    },
    {
      id: "body-fat-calculator",
      title: "Body Fat Calculator",
      category: "Health & Fitness",
      categoryId: "health",
      url: "calculators/body-fat-calculator.html",
      description: "Estimate body fat percentage using the U.S. Navy circumference method.",
      keywords: "body fat percentage navy method waist neck",
      popular: false,
      recent: false
    },

    // D. Date and Time Calculators (6)
    {
      id: "age-calculator",
      title: "Age Calculator",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/age-calculator.html",
      description: "Find exact chronological age in years, months, days, and countdown to next birthday.",
      keywords: "birthday age years months days born",
      popular: true,
      recent: false
    },
    {
      id: "date-difference-calculator",
      title: "Date Difference Calculator",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/date-difference-calculator.html",
      description: "Calculate the exact duration between two calendar dates in years, months, weeks, and days.",
      keywords: "calendar duration between two dates",
      popular: false,
      recent: false
    },
    {
      id: "days-between-dates",
      title: "Days Between Dates",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/days-between-dates.html",
      description: "Count total calendar days, weeks, and hours between any start and end date.",
      keywords: "day counter count days leap year",
      popular: false,
      recent: false
    },
    {
      id: "time-calculator",
      title: "Time Calculator",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/time-calculator.html",
      description: "Add or subtract hours, minutes, and seconds for schedules, media, and logs.",
      keywords: "add subtract hours minutes seconds duration",
      popular: false,
      recent: false
    },
    {
      id: "working-days-calculator",
      title: "Working Days Calculator",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/working-days-calculator.html",
      description: "Count business days between dates while excluding weekends and custom holiday dates.",
      keywords: "business days weekdays workdays exclude weekends",
      popular: false,
      recent: false
    },
    {
      id: "hours-calculator",
      title: "Hours Calculator",
      category: "Date & Time",
      categoryId: "datetime",
      url: "calculators/hours-calculator.html",
      description: "Calculate shift hours worked between clock-in and clock-out times minus breaks.",
      keywords: "timesheet work hours shift clock in out",
      popular: false,
      recent: false
    },

    // E. Unit Converters (8)
    {
      id: "length-converter",
      title: "Length Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/length-converter.html",
      description: "Convert meters, kilometers, miles, yards, feet, inches, centimeters, and millimeters.",
      keywords: "distance meters feet inches miles km cm",
      popular: false,
      recent: false
    },
    {
      id: "weight-converter",
      title: "Weight Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/weight-converter.html",
      description: "Convert kilograms, grams, pounds, ounces, stones, and metric tons precisely.",
      keywords: "mass kg lbs pounds ounces grams stone",
      popular: false,
      recent: false
    },
    {
      id: "temperature-converter",
      title: "Temperature Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/temperature-converter.html",
      description: "Convert Celsius, Fahrenheit, and Kelvin temperatures with exact conversion formulas.",
      keywords: "celsius fahrenheit kelvin weather cooking",
      popular: false,
      recent: false
    },
    {
      id: "volume-converter",
      title: "Volume Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/volume-converter.html",
      description: "Convert liters, milliliters, US gallons, quarts, pints, cups, and fluid ounces.",
      keywords: "liters gallons cups ml oz liquid volume",
      popular: false,
      recent: false
    },
    {
      id: "speed-converter",
      title: "Speed Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/speed-converter.html",
      description: "Convert mph, km/h, meters per second, feet per second, and knots.",
      keywords: "velocity mph kmh knots meters per second",
      popular: false,
      recent: false
    },
    {
      id: "area-converter",
      title: "Area Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/area-converter.html",
      description: "Convert square feet, square meters, acres, hectares, and square miles.",
      keywords: "square feet meters acres hectares land area",
      popular: false,
      recent: false
    },
    {
      id: "data-storage-converter",
      title: "Data Storage Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/data-storage-converter.html",
      description: "Convert bytes, KB, MB, GB, TB, and PB using decimal (SI) or binary (IEC) standards.",
      keywords: "bytes kb mb gb tb gib mib file size",
      popular: false,
      recent: false
    },
    {
      id: "pressure-converter",
      title: "Pressure Converter",
      category: "Unit Converters",
      categoryId: "converters",
      url: "calculators/pressure-converter.html",
      description: "Convert pascals, kilopascals, bar, PSI, atmospheres, and mmHg accurately.",
      keywords: "pressure psi bar kpa pascal atm torr mmhg tire",
      popular: false,
      recent: true
    },

    // F. Education Calculators (5)
    {
      id: "gpa-calculator",
      title: "GPA Calculator",
      category: "Education",
      categoryId: "education",
      url: "calculators/gpa-calculator.html",
      description: "Compute semester and cumulative Grade Point Average on a standard 4.0 scale.",
      keywords: "grade point average college credits courses",
      popular: false,
      recent: false
    },
    {
      id: "grade-calculator",
      title: "Grade Calculator",
      category: "Education",
      categoryId: "education",
      url: "calculators/grade-calculator.html",
      description: "Calculate current weighted course grade across assignments, quizzes, and exams.",
      keywords: "course grade percentage weights assignments",
      popular: false,
      recent: false
    },
    {
      id: "exam-score-calculator",
      title: "Exam Score Calculator",
      category: "Education",
      categoryId: "education",
      url: "calculators/exam-score-calculator.html",
      description: "Calculate test percentage score from correct answers, total questions, and optional penalty.",
      keywords: "test score quiz percentage grade points",
      popular: false,
      recent: false
    },
    {
      id: "weighted-average-calculator",
      title: "Weighted Average Calculator",
      category: "Education",
      categoryId: "education",
      url: "calculators/weighted-average-calculator.html",
      description: "Compute averages when each value carries a different percentage or numeric weight.",
      keywords: "weighted mean grades scores weights",
      popular: false,
      recent: false
    },
    {
      id: "final-exam-calculator",
      title: "Final Exam Calculator",
      category: "Education",
      categoryId: "education",
      url: "calculators/final-exam-calculator.html",
      description: "Find the minimum score needed on your final exam to achieve your target course grade.",
      keywords: "final exam grade needed target score semester",
      popular: false,
      recent: true
    },

    // G. Business Calculators (5)
    {
      id: "roi-calculator",
      title: "ROI Calculator",
      category: "Business & Marketing",
      categoryId: "business",
      url: "calculators/roi-calculator.html",
      description: "Measure Return on Investment and annualized ROI from total gain and initial cost.",
      keywords: "return on investment profit cost annualized",
      popular: false,
      recent: false
    },
    {
      id: "roas-calculator",
      title: "ROAS Calculator",
      category: "Business & Marketing",
      categoryId: "business",
      url: "calculators/roas-calculator.html",
      description: "Evaluate Return on Ad Spend and marketing efficiency ratio from ad revenue and spend.",
      keywords: "return on ad spend ppc marketing ads",
      popular: false,
      recent: true
    },
    {
      id: "break-even-calculator",
      title: "Break-Even Calculator",
      category: "Business & Marketing",
      categoryId: "business",
      url: "calculators/break-even-calculator.html",
      description: "Find break-even units and revenue from fixed costs, variable cost, and unit price.",
      keywords: "break even point fixed variable cost units",
      popular: false,
      recent: false
    },
    {
      id: "revenue-calculator",
      title: "Revenue Calculator",
      category: "Business & Marketing",
      categoryId: "business",
      url: "calculators/revenue-calculator.html",
      description: "Project gross revenue, net revenue after discounts/refunds, and average order value.",
      keywords: "sales revenue units price gross net",
      popular: false,
      recent: false
    },
    {
      id: "markup-calculator",
      title: "Markup Calculator",
      category: "Business & Marketing",
      categoryId: "business",
      url: "calculators/markup-calculator.html",
      description: "Determine selling price and gross margin from unit cost and desired markup percentage.",
      keywords: "markup pricing retail cost margin",
      popular: false,
      recent: false
    }
  ];

  var ARTICLES = [
    {
      title: "How to Calculate Percentages: A Complete Guide",
      category: "Basic & Math",
      readTime: "6 min read",
      url: "articles/how-to-calculate-percentage.html",
      description: "Master percentage formulas, percentage change, reverse percentages, and mental math shortcuts with clear examples."
    },
    {
      title: "How Does a Mortgage Calculator Work?",
      category: "Financial",
      readTime: "6 min read",
      url: "articles/how-does-a-mortgage-calculator-work.html",
      description: "Understand fixed-rate mortgage amortization, PITI housing costs, down payments, and bi-weekly schedules."
    },
    {
      title: "Simple Interest vs Compound Interest",
      category: "Financial",
      readTime: "6 min read",
      url: "articles/simple-interest-vs-compound-interest.html",
      description: "Compare linear simple interest against monthly compounding over 1 to 20 years and learn why APR differs from APY."
    },
    {
      title: "How to Calculate Your BMI",
      category: "Health & Fitness",
      readTime: "5 min read",
      url: "articles/how-to-calculate-bmi.html",
      description: "Learn the metric and imperial BMI equations, standard adult classification ranges, and key screening limitations."
    },
    {
      title: "How to Calculate Your Daily Calorie Needs",
      category: "Health & Fitness",
      readTime: "6 min read",
      url: "articles/how-to-calculate-daily-calories.html",
      description: "Estimate resting BMR with the Mifflin-St Jeor equation and apply activity multipliers for daily TDEE."
    },
    {
      title: "How to Calculate Your Age Accurately",
      category: "Date & Time",
      readTime: "5 min read",
      url: "articles/how-to-calculate-age.html",
      description: "Use structured calendar borrowing, Gregorian leap-year rules, and UTC date math to calculate exact chronological age."
    },
    {
      title: "Understanding Loan Payments and Interest Rates",
      category: "Financial",
      readTime: "6 min read",
      url: "articles/how-to-calculate-monthly-loan-payment.html",
      description: "Understand the amortization formula, how loan term affects total interest, APR vs nominal rate, and prepayments."
    },
    {
      title: "How to Calculate Profit Margin for Your Business",
      category: "Business & Marketing",
      readTime: "5 min read",
      url: "articles/how-to-calculate-profit-margin.html",
      description: "Avoid pricing mistakes by distinguishing gross profit margin from cost-based markup and net margin."
    },
    {
      title: "How to Convert Temperature, Weight, and Length",
      category: "Unit Converters",
      readTime: "6 min read",
      url: "articles/how-to-convert-temperature-weight-length.html",
      description: "Step-by-step equations for converting Celsius, Fahrenheit, Kelvin, kilograms, pounds, stones, miles, and meters."
    },
    {
      title: "How to Calculate Your GPA",
      category: "Education",
      readTime: "5 min read",
      url: "articles/how-to-calculate-gpa.html",
      description: "Calculate credit-weighted grade points on a 4.0 scale for semester and cumulative academic transcripts."
    }
  ];

  global.CALCMASTER_CATALOG = {
    categories: CATEGORIES,
    calculators: CALCULATORS,
    articles: ARTICLES
  };
})(window);

/* ==========================================================================
   CalcMaster Live Search Engine
   Supports Hero Search, Header Search Overlay, and Keyboard Navigation.
   ========================================================================== */
(function () {
  "use strict";

  function getBasePrefix() {
    var rootAttr = document.body ? document.body.getAttribute("data-root") : "";
    return rootAttr || "";
  }

  function resolveUrl(relativePath) {
    return getBasePrefix() + relativePath;
  }

  function scoreItem(item, query) {
    var q = query.toLowerCase();
    var title = item.title.toLowerCase();
    var cat = item.category.toLowerCase();
    var desc = item.description.toLowerCase();
    var keys = (item.keywords || "").toLowerCase();

    if (title === q) return 100;
    if (title.indexOf(q) === 0) return 85;
    if (title.indexOf(q) !== -1) return 70;
    if (keys.indexOf(q) !== -1) return 50;
    if (cat.indexOf(q) !== -1) return 35;
    if (desc.indexOf(q) !== -1) return 20;

    var parts = q.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      var haystack = title + " " + keys + " " + cat + " " + desc;
      var allMatch = parts.every(function (p) {
        return haystack.indexOf(p) !== -1;
      });
      if (allMatch) return 40;
    }
    return 0;
  }

  function searchCatalog(query) {
    var catalog = window.CALCMASTER_CATALOG;
    if (!catalog || !catalog.calculators) return [];

    var trimmed = query.trim();
    if (!trimmed) return [];

    var scored = [];
    for (var i = 0; i < catalog.calculators.length; i++) {
      var item = catalog.calculators[i];
      var score = scoreItem(item, trimmed);
      if (score > 0) {
        scored.push({ item: item, score: score });
      }
    }

    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.title.localeCompare(b.item.title);
    });

    return scored.slice(0, 8).map(function (entry) {
      return entry.item;
    });
  }

  function initSearchWidget(container) {
    var input = container.querySelector("[data-search-input]");
    var resultsEl = container.querySelector("[data-search-results]");
    var clearBtn = container.querySelector("[data-search-clear]");
    if (!input || !resultsEl) return;

    var activeIndex = -1;
    var currentResults = [];

    function closeResults() {
      resultsEl.classList.remove("is-open");
      resultsEl.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      activeIndex = -1;
    }

    function updateSelection() {
      var items = resultsEl.querySelectorAll(".search-result-item");
      for (var i = 0; i < items.length; i++) {
        if (i === activeIndex) {
          items[i].classList.add("is-selected");
          items[i].setAttribute("aria-selected", "true");
          if (items[i].scrollIntoView) {
            items[i].scrollIntoView({ block: "nearest" });
          }
        } else {
          items[i].classList.remove("is-selected");
          items[i].setAttribute("aria-selected", "false");
        }
      }
    }

    function renderResults(query) {
      var trimmed = query.trim();
      if (clearBtn) {
        clearBtn.classList.toggle("is-visible", trimmed.length > 0);
      }

      if (!trimmed) {
        closeResults();
        return;
      }

      currentResults = searchCatalog(trimmed);
      activeIndex = -1;
      resultsEl.innerHTML = "";

      if (currentResults.length === 0) {
        var empty = document.createElement("div");
        empty.className = "search-empty";
        empty.textContent = 'No calculators found for "' + trimmed + '". Try "loan", "BMI", "pressure", or "GPA".';
        resultsEl.appendChild(empty);
      } else {
        for (var i = 0; i < currentResults.length; i++) {
          var calc = currentResults[i];
          var link = document.createElement("a");
          link.className = "search-result-item";
          link.href = resolveUrl(calc.url);
          link.setAttribute("role", "option");
          link.setAttribute("aria-selected", "false");

          var textWrap = document.createElement("span");
          var titleSpan = document.createElement("span");
          titleSpan.className = "search-result-title";
          titleSpan.textContent = calc.title;

          var descSpan = document.createElement("span");
          descSpan.className = "search-result-desc";
          descSpan.textContent = calc.description;

          textWrap.appendChild(titleSpan);
          textWrap.appendChild(descSpan);

          var catSpan = document.createElement("span");
          catSpan.className = "search-result-cat";
          catSpan.textContent = calc.category;

          link.appendChild(textWrap);
          link.appendChild(catSpan);
          resultsEl.appendChild(link);
        }
      }

      resultsEl.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
    }

    var debounceTimer = null;
    input.addEventListener("input", function () {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(function () {
        renderResults(input.value);
      }, 90);
    });

    input.addEventListener("focus", function () {
      if (input.value.trim().length > 0) {
        renderResults(input.value);
      }
    });

    input.addEventListener("keydown", function (event) {
      var items = resultsEl.querySelectorAll(".search-result-item");
      if (event.key === "Escape") {
        closeResults();
        input.blur();
        return;
      }
      if (!resultsEl.classList.contains("is-open") || items.length === 0) {
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        updateSelection();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        updateSelection();
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          event.preventDefault();
          window.location.href = items[activeIndex].getAttribute("href");
        } else if (items[0]) {
          event.preventDefault();
          window.location.href = items[0].getAttribute("href");
        }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        closeResults();
        clearBtn.classList.remove("is-visible");
        input.focus();
      });
    }

    document.addEventListener("click", function (event) {
      if (!container.contains(event.target)) {
        closeResults();
      }
    });
  }

  window.CalcMasterSearch = {
    searchCatalog: searchCatalog
  };

  document.addEventListener("DOMContentLoaded", function () {
    var widgets = document.querySelectorAll("[data-search-widget]");
    for (var i = 0; i < widgets.length; i++) {
      initSearchWidget(widgets[i]);
    }
  });
})();
