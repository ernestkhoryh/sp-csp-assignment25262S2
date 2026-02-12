import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLocation } from 'react-router-dom';

function ShowItineraries() {
    const [itineraries, setItineraries] = useState([]);
    const { travelId } = useParams()
    const location = useLocation();
    const { listing } = location.state || {};

    useEffect(() => {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        fetch(`http://localhost:3000/travel-listings/${travelId}/itineraries`, requestOptions)
            .then(function (response) {
                return response.json()
            })
            .then(function (data) {
                setItineraries(data)
            })
            .catch(function (error) {
                console.log(error)
            })
    }, [travelId])

    return (
        <div>
            {itineraries.length > 0 ? (
                <>
                    <h1>{listing.title}-{listing.country}</h1>
                    {itineraries.map((item) => (
                        <div key={item.itineraryID}>
                            <h2>Day {item.day}</h2>
                            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed", textAlign: "center"}}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "10%"  }}>Time</th>
                                        <th style={{ width: "70%" }}>Activity</th>
                                        <th style={{ width: "20%" }}>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.activity.map((plan, index) => (
                                        <tr key={index}>
                                            <td>{plan.time}</td>
                                            <td>{plan.activity}</td>
                                            <td>{plan.location}</td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>

                        </div>

                    ))}
                </>
            ) : (
                <h1>Stay Tuned for Updated Itineraries</h1>
            )}
        </div>
    )

}

export default ShowItineraries;