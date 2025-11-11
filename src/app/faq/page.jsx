export default function FAQ() {
  return (
    <div className="max-w-screen-xl mx-auto mt-[80px] p-4">
      <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
      <main className="leading-8 mt-8">
        <div className="mt-2 space-y-8">
          <div className="border-b pb-2">
            <h3 className="text-xl font-semibold">What is PackHub?</h3>
            <p className="text-gray-700">
              PackHub is a peer-to-peer rental and sharing platform where people
              can lend, rent, and access items directly from one another, no
              middlemen, no extra fees. Just a community powered by convenience
              and trust.
            </p>
          </div>

          <div className="border-b pb-2">
            <h3 className="text-xl font-semibold">How do I get started?</h3>
            <p className="text-gray-700">
              Simply create an account and you’re good to go. List what you want
              to rent out, or browse items available near you. Book, meet,
              share. it’s quick and effortless.
            </p>
          </div>

          <div className="border-b pb-2">
            <h3 className="text-xl font-semibold">Is PackHub free to use?</h3>
            <p className="text-gray-700">
              Yes! Creating an account and listing your items is completely
              free. Our mission is to make sharing accessible, affordable, and
              fair for everyone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
