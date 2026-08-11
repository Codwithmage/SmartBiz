import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useBusiness } from "../../../context/BusinessContext";
import { useInventory } from "../context/InventoryContext";


function InventoryProducts() {

  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
  <table className="w-full text-left text-sm min-w-[650px]">
    {/* Table Head & Body */}
  </table>
</div>
  const navigate = useNavigate();

  const { business } = useBusiness();


  const {
    products,
    loadingProducts,
    loadProducts,
  } = useInventory();



  useEffect(() => {

    if (!business) return;

    loadProducts(business.id);

  }, [
    business,
    loadProducts,
  ]);





  if (loadingProducts) {

    return (

      <div className="flex items-center justify-center py-20">

        <h2 className="text-xl font-semibold">
          Loading Products...
        </h2>

      </div>

    );

  }





  return (

    <div>


      <div className="mb-8 flex items-center justify-between">


        <div>

          <h1 className="text-3xl font-bold">
            Products
          </h1>


          <p className="text-gray-500">
            Manage your inventory.
          </p>

        </div>




        <button

          onClick={() =>
            navigate("/inventory/add")
          }

          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"

        >

          + Add Product

        </button>


      </div>





      {
        products.length === 0 ? (


          <div className="rounded-xl bg-white p-10 shadow text-center">


            <h2 className="text-xl font-semibold">
              No Products Yet
            </h2>


            <p className="mt-3 text-gray-500">
              Your inventory is empty.
            </p>



          </div>


        ) : (


          <div className="rounded-xl bg-white shadow overflow-hidden">


            <table className="w-full">


              <thead className="bg-gray-100">


                <tr>


                  <th className="p-4 text-left">
                    SKU
                  </th>


                  <th className="p-4 text-left">
                    Product
                  </th>


                  <th className="p-4 text-left">
                    Category
                  </th>


                  <th className="p-4 text-left">
                    Stock
                  </th>


                  <th className="p-4 text-left">
                    Price
                  </th>


                </tr>


              </thead>



              <tbody>


                {
                  products.map(product => (


                    <tr
                      key={product.id}
                      className="border-t"
                    >


                      <td className="p-4">
                        {product.sku}
                      </td>


                      <td className="p-4">
                        {product.name}
                      </td>


                      <td className="p-4">
                        {product.categories?.name ?? "-"}
                      </td>


                      <td className="p-4">
                        {product.quantity}
                      </td>


                      <td className="p-4">
                        ₦{Number(product.selling_price).toLocaleString()}
                      </td>


                    </tr>


                  ))
                }


              </tbody>


            </table>


          </div>


        )
      }


    </div>

  );

}


export default InventoryProducts;