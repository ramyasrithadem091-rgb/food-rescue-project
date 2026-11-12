import {
  Utensils,
  Search,
  Handshake,
  Truck,
  ArrowRight
} from "lucide-react";

function HowItWorks() {

  const steps = [
    {
      number: "01",
      icon: <Utensils />,
      title: "Donate Food",
      description:
        "Donors post surplus food with quantity, location and safe consumption time."
    },
    {
      number: "02",
      icon: <Search />,
      title: "Smart Match",
      description:
        "Our system finds eligible receivers based on area, capacity, need and availability."
    },
    {
      number: "03",
      icon: <Handshake />,
      title: "Accept Food",
      description:
        "Verified receivers receive notifications and can accept suitable food donations."
    },
    {
      number: "04",
      icon: <Truck />,
      title: "Deliver & Confirm",
      description:
        "The donor or volunteer delivers the food and the receiver confirms the handover."
    }
  ];

  return (
    <section className="how-section" id="how-it-works">

      <div className="section-heading">

        <span className="section-tag">
          SIMPLE • SMART • IMPACTFUL
        </span>

        <h2>
          How <span>Food Rescue</span> Works
        </h2>

        <p>
          From surplus food to someone who needs it,
          our platform makes the entire journey simple,
          fast and organized.
        </p>

      </div>

      <div className="steps-container">

        {steps.map((step, index) => (

          <div className="step-wrapper" key={step.number}>

            <div className="step-card">

              <div className="step-number">
                {step.number}
              </div>

              <div className="step-icon">
                {step.icon}
              </div>

              <h3>{step.title}</h3>

              <p>{step.description}</p>

            </div>

            {index < steps.length - 1 && (
              <ArrowRight className="step-arrow" />
            )}

          </div>

        ))}

      </div>

    </section>
  );
}

export default HowItWorks;