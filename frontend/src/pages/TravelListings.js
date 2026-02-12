import React, { useState, useEffect } from 'react';
import {
Container,
Typography,
Button,
TextField,
Box,
CircularProgress,
Alert,
Select,
MenuItem,
FormControl,
InputLabel,
} from '@mui/material';
import { travelService } from '../services/api';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

const TravelListings = () => {
const [listings, setListings] = useState([]);
const [filteredListings, setFilteredListings] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [searchTerm, setSearchTerm] = useState('');
const [selectedId, setSelectedId] = useState('');
const navigate = useNavigate();

useEffect(() => {
fetchListings();
}, []);

useEffect(() => {
if (searchTerm.trim()) {
const searchLower = searchTerm.toLowerCase().trim();
const filtered = (listings || []).filter(listing =>
(listing.title && listing.title.toLowerCase().includes(searchLower)) ||
(listing.description && listing.description.toLowerCase().includes(searchLower)) ||
(listing.country && listing.country.toLowerCase().includes(searchLower))
);
setFilteredListings(filtered);
} else {
setFilteredListings(listings || []);
}
}, [searchTerm, listings]);

const fetchListings = async () => {
try {
setLoading(true);
const response = await travelService.getAllListings();
const data = Array.isArray(response.data) ? response.data : [];
setListings(data);
setFilteredListings(data);
} catch (err) {
console.error('Failed to fetch listings:', err);
setError('Failed to load travel listings.');
setListings([]);
setFilteredListings([]);
} finally {
setLoading(false);
}
};

const formatCurrency = (amount) => {
if (!amount) return 'N/A';
const num = parseFloat(amount);
return isNaN(num) ? 'Invalid' :
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

if (loading && listings.length === 0) {
return (
<Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
<CircularProgress />
<Typography sx={{ ml: 2 }}>Loading travel listings...</Typography>
</Container>
);
}

return (
<Container maxWidth="md">
<Box sx={{ my: 4 }}>
<Typography variant="h4" component="h1" gutterBottom>
Select Travel Package
</Typography>

<Typography variant="subtitle1" color="text.secondary" paragraph>
Choose a travel package to view itineraries
</Typography>

{error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

<Box sx={{ mb: 4 }}>
<TextField
fullWidth
variant="outlined"
placeholder="Search packages by title, country, or description..."
value={searchTerm}
onChange={(e) => setSearchTerm(e.target.value)}
InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
/>
</Box>

<FormControl fullWidth sx={{ mb: 3 }}>
<InputLabel>Select Travel Package</InputLabel>
<Select
value={selectedId}
label="Select Travel Package"
onChange={(e) => setSelectedId(e.target.value)}
disabled={filteredListings.length === 0 || loading}
>
<MenuItem value="" disabled>
{filteredListings.length === 0 ? 'No packages available' : 'Choose a package...'}
</MenuItem>
{filteredListings.map((listing) => (
<MenuItem key={listing.travelID} value={listing.travelID}>
{listing.title || 'Untitled'} - {listing.country || 'Unknown'} ({formatCurrency(listing.price)})
</MenuItem>
))}
</Select>
</FormControl>

{selectedId && (
<Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
<Button
variant="contained"
size="large"
onClick={() => {
    const selectedListing = filteredListings.find(
      (listing) => listing.travelID === selectedId
    );    
    navigate(`/travel-listings/${selectedId}/itineraries`, {state: {listing: selectedListing}});
}}
sx={{ flex: 1 }}
>
View Itineraries
</Button>
<Button
variant="outlined"
size="large"
onClick={() => setSelectedId('')}
>
Clear Selection
</Button>
</Box>
)}

<Box sx={{ mt: 4, textAlign: 'center' }}>
<Typography variant="body2" color="text.secondary">
Showing {filteredListings.length} package{filteredListings.length !== 1 ? 's' : ''}
</Typography>
<Button
variant="outlined"
onClick={fetchListings}
sx={{ mt: 1 }}
>
Refresh List
</Button>
</Box>
</Box>
</Container>
);
};

export default TravelListings;