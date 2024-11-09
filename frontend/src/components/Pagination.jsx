const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10; // Number of items to display per page

const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentItems = items.slice(startIndex, endIndex);

const handleNextPage = () => setCurrentPage(prev => prev + 1);
const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

return (
    <div>
        {currentItems.map(item => (
            <div key={item.id}>{/* Render your item */}</div>
        ))}
        <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
        <button onClick={handleNextPage} disabled={endIndex >= items.length}>Next</button>
    </div>
);
