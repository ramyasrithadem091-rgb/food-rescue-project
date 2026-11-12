import "./Impact.css";
import { Utensils, Users, HeartHandshake, Truck } from "lucide-react";

function Impact() {
  const impactData = [
    {
      icon: <Utensils />,
      number: "10,000+",
      title: "Meals Rescued",
      description: "Surplus meals redirected instead of wasted.",
    },
    {
      icon: <Users />,
      number: "2,500+",
      title: "People Served",
      description: "People connected with nutritious surplus food.",
    },
    {
      icon: <HeartHandshake />,
      number: "500+",
      title: "Active Donors",
      description: "People and organizations contributing food.",
    },
    {
      icon: <Truck />,
      number: "800+",
      title: "Deliveries",
      description: "Successful food pickups and deliveries.",
    },
  ];

  return (
    <section className="impact-section" id="impact">

      <div className="impact-heading">
        <span className="impact-tag">
          OUR IMPACT
        </span>

        <h2>
          Every Meal <span>Rescued</span> Matters.
        </h2>

        <p>
          Food Rescue turns surplus food into meaningful support
          for people and communities.
        </p>
      </div>

      <div className="impact-cards">

        {impactData.map((item, index) => (
          <div className="impact-card" key={index}>

            <div className="impact-number">
              {item.number}
            </div>

            <div className="impact-icon">
              {item.icon}
            </div>

            <h3>{item.title}</h3>

            <p>{item.description}</p>

          </div>
        ))}

      </div>

      <div className="impact-bottom">
        <div>
          <HeartHandshake />
          <strong>Community Driven</strong>
        </div>

        <div>
          <Utensils />
          <strong>Less Food Waste</strong>
        </div>

        <div>
          <Truck />
          <strong>Faster Redistribution</strong>
        </div>
      </div>

    </section>
  );
}

export default Impact;