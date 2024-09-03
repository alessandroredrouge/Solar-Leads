# Features
Here is a more detailed list of the core features that the software will have, which can be divided in:
- Data Collection
- Field Support
- Analytics

## Data Collection
The software will have the ability to record information from door-to-door interactions collected by the canvassers.
The initial data that will be collected will be divided in Mandatory and Optional.

**Mandatory**
- Address
- Timestamp (time of contact)
- Prospect response: it represents the answer (if any) of the potential prospect. This data is subdivided in the following subcategories:
    - No answer
    - Direct no (Homeowner)
    - Direct no (Renters)
    - Return later
    - Initial conversations
    - Detailed conversations
    - Appointments set
    - Undefined
- Reason of 'no' (if any): if the prospects says no, it can be useful to understand why. Below are some of the main reasons collected so far, that would be useful to keep track of to eventually adapt the offer:
    - Already got solar panels on rooftop
    - Does not make economical sense
    - Electricity bill is already low
    - Cannot get incentives from government
    - Busy at the moment
    - Too old
    - Very steep rooftop
    - Rooftop to renovate first
    - Does not trust door knocking people
    - Soon selling the house
    - ...

**Optional**
- Electricity bill estimate (if provided)
- Approximate age
- Presumed gender
- Presumed family status (single, married,...)
- Solar panels on roof (Y/N)
- House characteristics (e.g., with swimming pool, sunny area, partial shadowing from trees)
- Interest level
- Any additional notes / comments from the canvasser

## Field Support
The software will support the canvassers on the field thanks to the data collected. This support will be mainly provided in terms of:
- a map
- a route suggestion. 

**Optimized Canvassing Map**
This map shows the houses highlighted in different gradient of colors, from red (low probability of conversion) to green (high probability of conversion) based on how probable the software estimates that they would set up an appointment based on the data collected.

**Optimal Canvassing Route**
By having a map that determines the probability of conversion for each address (at least the ones for which data have been collected), the software also proposes a potential route for the canvasser to follow, in order to optimize its path on that workday and enhance the chances of setting up an appointment. This route basically connects the best houses evaluated in the previous step, including considerations of the time required to go from house to house by foot.

## Analytics
The software provides analytics of different types thanks to the collected data, from identifying the customer persona to tracking performances of the canvassers, estimating the efficacy of a specific sales pitch, identifying the best areas to canvass and so on...

# Software Structure


