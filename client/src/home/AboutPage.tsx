import { Link } from 'react-router-dom'
import './AboutPage.css'

const guideLinks = [
  ['getting-started', 'Getting Started'],
  ['challenge-types', 'Core vs. Community'],
  ['challenges', 'Challenges & Quizzes'],
  ['scoring', 'Scores & Attempts'],
  ['achievements', 'Achievements'],
  ['leaderboards', 'Leaderboards'],
  ['hall-of-fame', 'Hall of Fame'],
  ['fair-play', 'Fair Play'],
] as const

const AboutPage = () => (
  <main className="container">
    <div className="about-page">
      <section className="about-hero text-center mb-5">
        <span className="about-eyebrow">ABOUT THE PLATFORM</span>
        <h1 className="display-5 fw-bold mt-3 mb-3">Learning Challenge Hub</h1>
        <p className="about-intro mx-auto">
          An interactive learning platform where users can create challenges,
          test their knowledge, earn achievements and track their progress.
        </p>
      </section>

      <section className="mb-5" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="h3 fw-bold mb-4">How It Works</h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="about-card h-100">
              <span className="about-step">01</span>
              <h3 className="h5 fw-bold mt-3">Create &amp; Explore</h3>
              <p>Discover challenges on different topics or create your own quizzes with questions, images and customizable settings.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="about-card h-100">
              <span className="about-step">02</span>
              <h3 className="h5 fw-bold mt-3">Learn &amp; Improve</h3>
              <p>Complete challenges, receive scores and review your attempt history as you improve your knowledge.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="about-card h-100">
              <span className="about-step">03</span>
              <h3 className="h5 fw-bold mt-3">Earn &amp; Compete</h3>
              <p>Unlock achievements, collect Achievement Points and compete with other learners through leaderboards.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5" aria-labelledby="platform-guide">
        <span className="about-eyebrow">USER GUIDE</span>
        <h2 id="platform-guide" className="h3 fw-bold mt-2 mb-3">Platform Guide</h2>
        <p className="about-section-intro mb-4">Learn how challenges, achievements and rankings work, and how to get the most out of the platform.</p>
        <nav className="about-guide-nav mb-4" aria-label="Platform guide sections">
          {guideLinks.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <article id="getting-started" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Getting Started</h3>
          <p>You can explore published challenges without creating an account. To participate, track your progress and create your own challenges, register an account and log in.</p>
          <p>Once logged in, use the navigation menu to access your challenges, create new ones and view your achievements.</p>
        </article>

        <article id="challenge-types" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Core vs. Community Challenges</h3>
          <p>Learning Challenge Hub has two categories of challenges, each serving a different purpose.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Core Challenges</h4>
          <p>Core Challenges are part of the platform's official challenge collection. They contribute to the Core Leaderboard, where only the first completed attempt per user and challenge counts.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Community Challenges</h4>
          <p>Community Challenges allow users to share knowledge and challenge each other on different topics. They have individual challenge leaderboards, but do not contribute to the Core Leaderboard.</p>
          <div className="about-info-note"><strong>Remember:</strong> Both categories support quiz scores, attempt history and learning progress. Only Core Challenges contribute to the overall Core Leaderboard.</div>
        </article>

        <article id="challenges" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Challenges &amp; Quizzes</h3>
          <p>Challenges are quizzes created by users or administrators. Each challenge contains questions with assigned point values.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Question Types</h4>
          <ul>
            <li><strong>Single Choice:</strong> Select one answer from the available options.</li>
            <li><strong>Multiple Choice:</strong> Select the correct combination of answers.</li>
            <li><strong>Short Answer:</strong> Enter a written answer.</li>
          </ul>
          <h4 className="h6 fw-bold mt-4 mb-2">Creating Challenges</h4>
          <p>Registered users can create their own challenges, add questions, assign points and choose images. Challenge settings allow creators to control how their quizzes are presented.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Answer Review</h4>
          <p>Challenge creators can decide whether participants may review the correct answers after completing a quiz.</p>
          <p>When answer review is disabled, participants can still see their overall score, time used and points earned for each question, but the correct answers and explanations remain hidden.</p>
        </article>

        <article id="scoring" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Scores &amp; Attempts</h3>
          <p>Each question has a point value. Your total quiz score is calculated from the points earned across the questions.</p>
          <p>After completing a challenge, you can see your score, the maximum available points and how long the attempt took.</p>
          <p>You can attempt a challenge multiple times. Your attempt history allows you to compare previous results and track your progress.</p>
          <div className="about-info-note"><strong>Important:</strong> Quiz Scores and Achievement Points are two different scoring systems. Quiz Scores measure performance in challenges, while Achievement Points are earned by unlocking achievements.</div>
        </article>

        <article id="achievements" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Achievements</h3>
          <p>Achievements reward users for reaching milestones and completing activities on the platform. Each achievement has its own requirements.</p>
          <p>When you meet the requirements for an active achievement, it can be unlocked and added to your achievement collection.</p>
          <p>Eligible achievements award <strong>Achievement Points (AP)</strong>. These points contribute to your position in the Hall of Fame.</p>
          <p>You can visit the Achievements page to see which achievements you have unlocked and which ones you can still work towards.</p>
        </article>

        <article id="leaderboards" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Leaderboards</h3>
          <p>Leaderboards allow users to compare their performance with other participants.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Challenge Leaderboards</h4>
          <p>Individual challenges have their own leaderboards. Rankings are based on quiz scores, with completion time used to separate users who achieve the same score.</p>
          <h4 className="h6 fw-bold mt-4 mb-2">Core Leaderboard</h4>
          <p>The Core Leaderboard combines results from challenges designated as Core Challenges. These challenges contribute to an overall competitive ranking.</p>
          <ul>
            <li>Only Core Challenges contribute to this leaderboard.</li>
            <li>Only the first completed attempt per user and Core Challenge counts.</li>
            <li>Scores are normalized to a maximum of 100 points per challenge.</li>
            <li>Attempts with zero points do not contribute to the total.</li>
            <li>Completion time is used as a tie-breaker when applicable.</li>
          </ul>
          <div className="about-info-note"><strong>Example:</strong> Earning 15 out of 20 points on a Core Challenge contributes 75 normalized points to your Core Leaderboard total.</div>
        </article>

        <article id="hall-of-fame" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Hall of Fame</h3>
          <p>The Hall of Fame recognizes users who have earned Achievement Points through their accomplishments on the platform.</p>
          <p>Unlike quiz leaderboards, the Hall of Fame is based on Achievement Points rather than individual quiz scores.</p>
          <p>Users with the same number of Achievement Points share the same rank.</p>
        </article>

        <article id="fair-play" className="about-guide-card mb-3">
          <h3 className="h4 fw-bold mb-3">Fair Play &amp; Rankings</h3>
          <p>Learning Challenge Hub includes rules designed to keep competitive rankings fair.</p>
          <ul>
            <li>Challenge creators are excluded from the competitive rankings for their own challenges.</li>
            <li>Administrators may test challenges, but their attempts do not contribute to competitive leaderboards.</li>
            <li>Repeated attempts do not replace the first completed attempt used for Core Leaderboard scoring.</li>
            <li>Users with equivalent ranking results may share the same position.</li>
          </ul>
        </article>
      </section>

      <section className="about-project mb-4" aria-labelledby="about-project">
        <span className="about-eyebrow">THE PROJECT</span>
        <h2 id="about-project" className="h3 fw-bold mt-2 mb-3">Built as a Student Project</h2>
        <p>Learning Challenge Hub was developed as part of ITPE3200 Web Applications at OsloMet.</p>
        <p>The project explores full-stack web development, database management, authentication, authorization and interactive user experiences.</p>
        <h3 className="h5 fw-bold mt-4 mb-3">Technologies</h3>
        <div className="d-flex flex-wrap gap-2">
          {['ASP.NET Core Web API', 'React', 'TypeScript', 'C#', 'Entity Framework Core', 'SQLite', 'Bootstrap'].map(technology => (
            <span className="about-tech" key={technology}>{technology}</span>
          ))}
        </div>
      </section>

      <div className="text-center mb-4">
        <Link to="/challenges" className="btn about-explore-button">Explore Challenges</Link>
      </div>
    </div>
  </main>
)

export default AboutPage
