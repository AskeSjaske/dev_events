import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import events from "@/lib/constants";

const Home = () => {
  return (
    <section>
      <h1 className="text-center">The Hub for Every Dev <br/> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons, Me and Conferences, All in One Place</p>
      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Feature Events</h3>

        <ul className="events">
          {events.map((event) => (
            <li className="list-none" key={event.id}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
} 

export default Home
