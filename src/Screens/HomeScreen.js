import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  FlatList,
  Animated,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MiniProduct from "../Common/Product/MiniProduct";
import Header from "./Header";
import { storage } from "../Common/Common";
import Icon from "react-native-vector-icons/Feather";
import api from "../Service/api";
import { font } from "../Common/Theme";
import SearchModal from "./SearchModal";
import SortingDropdown from "./SortingDropdown";

const HomeScreen = ({ navigation }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);

  const [totalItems, setTotalItems] = useState(0);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isAppliedFiltersVisible, setIsAppliedFiltersVisible] = useState(false);
  const [render, setRender] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchData, setSearchData] = useState(null);

  const [isFullScreenLoading, setFullScreenLoading] = useState(false);
  const [itemCount, setItemCount] = useState(0);
  const data = [
    { label: "Newest First", value: "New False" },
    { label: "Price Low - High", value: "Price True" },
    { label: "Price High - Low", value: "Price False" },
    { label: "Weight Low - High", value: "Weight True" },
    { label: "Weight High - Low", value: "Weight False" },
  ];
  const [filterDropdownValue, setFilterDropdownValue] = useState(
    data[0]?.value
  );
  const fetchProducts = async (fromsearch = false) => {
    if ((isFullScreenLoading || !hasMore) && fromsearch) return;
    setLoading(true);
    setFullScreenLoading(true);
    try {
      let url = "";
      if (storage.getString("token")) {
        url = `pim/searchFilter?page=${
          fromsearch ? 0 : page
        }&size=${16}&sortData=${filterDropdownValue}`;
      } else {
        url = `pim/sampleProduct`;
      }
      const response = await api.post(url, searchData);
      if (!response || !response.response) {
        throw new Error("Invalid response structure");
      }
      const pim = response.response.content || [];
      setTotalItems(response.response.totalElements);

      const filteredPim = pim?.map((p) => ({
        ...p,
        pimVariants: Array.isArray(p.pimVariants)
          ? p.pimVariants.filter((pv) => pv.status === "ACTIVE")
          : [],
      }));
      const totalPages = response.response.totalPages;
      setItemCount(response.response.totalElements);

      if (render) {
        setProductList((prev) => [...prev, ...filteredPim]);
      } else {
        setProductList(filteredPim);
        setRender(true);
      }

      setHasMore(page < totalPages - 1);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
      setFullScreenLoading(false);
    }
  };
  useEffect(() => {
    if (filterDropdownValue.length != 0) {
      fetchProducts();
    }
  }, [page]);
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchProducts(true);
    setRefreshing(false);
  };

  const getGridData = () => {
    const numColumns = 2;
    const rows = Math.ceil(productList.length / numColumns);
    const gridData = [...productList];
    const emptyItems = rows * numColumns - productList.length;

    for (let i = 0; i < emptyItems; i++) {
      gridData.push({ id: `empty-${i}`, empty: true });
    }

    return gridData;
  };

  const renderProduct = ({ item }) => (
    <View style={styles.itemContainer}>
      <MiniProduct product={item} navigation={navigation} />
    </View>
  );

  const renderGridItem = ({ item }) =>
    item.empty ? (
      <View style={[styles.itemContainer, styles.emptyItem]} />
    ) : (
      renderProduct({ item })
    );

  useEffect(() => {
    if (filterDropdownValue !== null) {
      setProductList([]);
      fetchProducts();
    }
  }, [filterDropdownValue, searchData]);

  const handleSearchData = (searchData) => {
    if (searchData.data && Object.keys(searchData.data[0]).length > 0) {
      setSearchData(searchData.data[0]);
    } else {
      setSearchData(null);
    }
  };
  const SearchAndFilterTab = () => {
    return (
      <View style={styles.searchContainerMain}>
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={[styles.searchButton]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.searchButtonText}>
              <Icon name="search" size={12} />
              Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setIsAppliedFiltersVisible(!isAppliedFiltersVisible);
            }}
          >
            <Text style={styles.searchButtonText}>
              Applied Filters
              <Icon
                name={isAppliedFiltersVisible ? "chevron-up" : "chevron-down"}
                size={14}
              />
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <Header scrollY={scrollY} />
      {isFullScreenLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6F61" />
        </View>
      )}
      <Animated.View
        style={[
          styles.searchAndFilterContainer,
          {
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -50],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        {SearchAndFilterTab()}
        {isAppliedFiltersVisible && (
          <View style={styles.filterVisibleContainer}>
            <Text>Hello</Text>
          </View>
        )}

        <SearchModal
          isVisible={isModalVisible}
          onClose={() => setModalVisible(false)}
          searchData={handleSearchData}
        />
      </Animated.View>
      {productList.length === 0 && !isFullScreenLoading && (
        <View style={styles.noresultFoundContainer}>
          <Text style={styles.noResultFound}>No Results found</Text>
        </View>
      )}

      {productList.length > 0 && (
        <Animated.FlatList
          data={getGridData()}
          renderItem={renderGridItem}
          keyExtractor={(item) => {
            return item.pimId;
          }}
          ListHeaderComponent={
            <View style={styles.totalItemsContainer}>
              <Text style={styles.totalItemsText}>
                Total Items: {totalItems}
              </Text>
              <SortingDropdown
                setFilterDropdownValue={setFilterDropdownValue}
                initialValue={filterDropdownValue}
                data={data}
              />
            </View>
          }
          contentContainerStyle={[
            styles.listContainer,
            { paddingTop: isAppliedFiltersVisible ? 150 : 100 },
          ]}
          numColumns={2}
          maxToRenderPerBatch={6}
          initialNumToRender={6}
          windowSize={5}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            console.log("End of list reached!");
            console.log(hasMore + "hasMore");
            if (hasMore) {
              setPage((prev) => prev + 1);
            }
          }}
          showsVerticalScrollIndicator={false}
          // refreshing={refreshing}
          // onRefresh={onRefresh}
          decelerationRate="fast"
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  listContainer: {
    padding: 4,
  },
  itemContainer: {
    flex: 1,
  },
  emptyItem: {
    backgroundColor: "transparent",
  },
  noresultFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  noResultFound: {
    marginTop: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: "#000",
    textAlign: "center",
    fontSize: 16,
    fontFamily: font.bold,
    fontWeight: "bold",
  },
  searchAndFilterContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  totalItemsContainer: {
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  totalItemsText: {
    color: "#333",
    fontSize: 16,
    fontFamily: font.medium,
    marginTop: 10,
  },

  searchContainerMain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 50,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: "100%",
  },
  searchButton: {
    width: "50%",
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: font.medium,
  },
  openModalButton: {
    backgroundColor: "#FF6F61",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  filterVisibleContainer: {
    marginTop: 100,
    width: "100%",
    height: "50",
    backgroundColor: "#F8F8F8",
  },
});
