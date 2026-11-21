function getFacultyAvailability(occupiedSeats, capacity) {
  const occ = occupiedSeats || 0;
  const cap = capacity || 0;

  if (cap <= 0 || occ >= cap) {
    return {
      availability_status: 'FULL',
      availability_label: 'Full',
      availability_color: 'red',
      display_status: 'Faculty Capacity Reached',
      is_full: true
    };
  }

  const occupancy = occ / cap;
  if (occupancy > 0.4) {
    return {
      availability_status: 'FILLING_FAST',
      availability_label: 'Filling Fast',
      availability_color: 'yellow',
      display_status: 'Filling Fast',
      is_full: false
    };
  }

  return {
    availability_status: 'AVAILABLE',
    availability_label: 'Available',
    availability_color: 'green',
    display_status: 'Available',
    is_full: false
  };
}

module.exports = { getFacultyAvailability };
