export function CareerLearningSection() {
  return (
    <section className="career-learning-section" aria-label="Learning and career guidance">
      <div className="container">
        <div className="career-learning-grid">
          <article className="career-learning-card career-learning-card-primary">
            <div className="career-learning-card-header">
              <span className="career-learning-icon" aria-hidden="true"><i className="fa fa-laptop" /></span>
              <span className="career-learning-label">Flexible Learning</span>
            </div>
            <h4>Learn Today. <span>Use Your Skills Tomorrow.</span></h4>
            <p>
              Busy with college or work? Our Job oriented online training platform gives you a simple way to learn from home and build useful skills. EduWrap is a Practical hands-on learning hub where you can learn through simple lessons, tasks, and projects.
            </p>
            <p>
              You can learn the basics and practise them through projects. This makes our IT and software development courses a good starting point for people who want to build a career in tech.
            </p>
          </article>

          <article className="career-learning-card career-learning-card-secondary">
            <div className="career-learning-card-header">
              <span className="career-learning-icon" aria-hidden="true"><i className="fa fa-briefcase" /></span>
              <span className="career-learning-label">Career Growth</span>
            </div>
            <div className="career-learning-title">Your Career. Your Choice. <span>Your Next Step.</span></div>
            <p>
              As a Professional skill development institute, we help you learn skills that can be useful in real jobs. You can choose a course based on your interests and career plans.
            </p>
            <p>
              Our Career-focused skill training helps you stay focused on your goal while you learn. With the right practice and support, you can take your next step with more confidence.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
