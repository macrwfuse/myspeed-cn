import {useState, useEffect} from "react";
import {faNetworkWired, faLocationDot, faBuilding} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import "./styles.sass";
import {t} from "i18next";

const NetworkInfo = () => {
    const [networkInfo, setNetworkInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNetworkInfo = async () => {
            try {
                const response = await fetch("/api/info/network-info");
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setNetworkInfo(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNetworkInfo();
        // 每5分钟刷新一次
        const interval = setInterval(fetchNetworkInfo, 300000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="network-info-area">
            <div className="network-info-item">
                <FontAwesomeIcon icon={faNetworkWired} className="network-icon"/>
                <span className="network-label">{t("network.ip")}</span>
                <span className="network-value loading">{t("network.loading")}</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="network-info-area">
            <div className="network-info-item">
                <FontAwesomeIcon icon={faNetworkWired} className="network-icon"/>
                <span className="network-label">{t("network.ip")}</span>
                <span className="network-value error">{t("network.error")}</span>
            </div>
        </div>
    );

    return (
        <div className="network-info-area">
            <div className="network-info-item">
                <FontAwesomeIcon icon={faNetworkWired} className="network-icon"/>
                <span className="network-label">{t("network.ip")}</span>
                <span className="network-value">{networkInfo.ip}</span>
            </div>
            <div className="network-info-item">
                <FontAwesomeIcon icon={faBuilding} className="network-icon"/>
                <span className="network-label">{t("network.isp")}</span>
                <span className="network-value">{networkInfo.isp || networkInfo.org}</span>
            </div>
            <div className="network-info-item">
                <FontAwesomeIcon icon={faLocationDot} className="network-icon"/>
                <span className="network-label">{t("network.location")}</span>
                <span className="network-value">
                    {[networkInfo.city, networkInfo.region, networkInfo.country].filter(Boolean).join(", ")}
                </span>
            </div>
        </div>
    );
};

export default NetworkInfo;